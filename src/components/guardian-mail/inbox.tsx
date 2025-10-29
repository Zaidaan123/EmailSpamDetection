
'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import type { InboxEmail, SummarizationState } from '@/lib/types';
import { inboxEmails } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Archive, Bot, Clock, Loader2, Mail as MailIcon, Reply, Trash, FileText, Shield, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useDashboardState } from '@/hooks/use-dashboard-state';
import { summarizeEmailAction, analyzeUrlAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


export function Inbox() {
  const [selectedEmail, setSelectedEmail] = useState<InboxEmail | null>(inboxEmails[0]);
  const [summarizationState, setSummarizationState] = useState<SummarizationState>({ status: 'idle', result: null, error: null });
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
  const [processedEmailBody, setProcessedEmailBody] = useState<string | null>(null);

  const { setAnalyzeEmailFromInbox } = useDashboardState();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (selectedEmail) {
      setProcessedEmailBody(null); // Reset while processing
      const processEmailBody = async () => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(selectedEmail.body, 'text/html');
        const links = Array.from(doc.querySelectorAll('a'));
        
        if (links.length === 0) {
          setProcessedEmailBody(selectedEmail.body);
          return;
        }

        const riskPromises = links.map(link => 
          analyzeUrlAction({ url: link.href })
            .then(result => ({ href: link.href, ...result }))
        );

        const results = await Promise.all(riskPromises);

        results.forEach(({ href, data, error }) => {
          const link = doc.querySelector(`a[href="${href}"]`);
          if (link) {
            const wrapper = doc.createElement('span');
            wrapper.className = 'inline-flex items-center gap-1';
            
            const icon = doc.createElement('span');
            icon.dataset.risk = error ? 'unknown' : (data?.riskScore ?? 0) > 0.7 ? 'high' : (data?.riskScore ?? 0) > 0.4 ? 'medium' : 'low';
            
            link.parentNode?.insertBefore(wrapper, link);
            wrapper.appendChild(link);
            wrapper.appendChild(icon);
          }
        });

        setProcessedEmailBody(doc.body.innerHTML);
      };

      processEmailBody();
    }
  }, [selectedEmail]);

  const handleAnalyzeClick = () => {
    if (selectedEmail) {
      // Basic regex to find URLs in the HTML body
      const urlRegex = /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/g;
      const urls = [];
      let match;
      while ((match = urlRegex.exec(selectedEmail.body)) !== null) {
        urls.push(match[2]);
      }
      
      const emailDataForAnalysis = {
        emailSubject: selectedEmail.subject,
        // Extract domain from email
        senderDomain: selectedEmail.from.email.split('@')[1] || 'unknown.com',
        // Using a placeholder IP as it's not available in mock data
        senderIp: '127.0.0.1', 
        emailBody: selectedEmail.body,
        urlList: urls,
      };

      setAnalyzeEmailFromInbox(emailDataForAnalysis);
      router.push('/');
    }
  };

  const handleSummarizeClick = async () => {
    if (!selectedEmail) return;

    setSummarizationState({ status: 'loading', result: null, error: null });
    setIsSummaryDialogOpen(true);

    const { data, error } = await summarizeEmailAction({ emailBody: selectedEmail.body });

    if (error) {
      setSummarizationState({ status: 'error', result: null, error });
      toast({ variant: 'destructive', title: 'Summarization Failed', description: error });
      // Don't close the dialog on error, show error message instead
    } else {
      setSummarizationState({ status: 'success', result: data, error: null });
    }
  }
  
  const renderProcessedBody = () => {
    if (!processedEmailBody) {
      return (
         <div className="prose prose-sm dark:prose-invert max-w-none">
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-4 w-5/6" />
         </div>
      );
    }
  
    const parser = new DOMParser();
    const doc = parser.parseFromString(processedEmailBody, 'text/html');
    const elements = Array.from(doc.body.childNodes);
  
    const toReactNode = (node: ChildNode, index: number): React.ReactNode => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent;
      }
  
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const children = Array.from(el.childNodes).map(toReactNode);
        
        if (el.tagName.toLowerCase() === 'span' && el.dataset.risk) {
            const risk = el.dataset.risk;
            let Icon = Shield;
            let color = "text-gray-400";
            let tooltipText = "Risk Unknown";

            if (risk === 'low') {
                Icon = ShieldCheck;
                color = "text-green-500";
                tooltipText = "This link is likely safe.";
            } else if (risk === 'medium') {
                Icon = ShieldAlert;
                color = "text-yellow-500";
                tooltipText = "This link is potentially suspicious. Proceed with caution.";
            } else if (risk === 'high') {
                Icon = ShieldAlert;
                color = "text-red-500";
                tooltipText = "This link is considered high-risk. Do not click.";
            }

            return (
                <TooltipProvider key={index}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="inline-flex items-center gap-1">
                                {children}
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                           <div className="flex items-center gap-2">
                                <Icon className={cn("size-4", color)} />
                                <p>{tooltipText}</p>
                           </div>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )
        }

        if (el.tagName.toLowerCase() === 'a') {
            const riskIconSpan = el.nextElementSibling;
            if (riskIconSpan && riskIconSpan.tagName.toLowerCase() === 'span' && riskIconSpan.dataset.risk) {
                // This link is already wrapped, return its content
                return React.createElement(el.tagName.toLowerCase(), { href: el.getAttribute('href'), target: "_blank", rel: "noopener noreferrer", key: index }, children);
            }
        }
        
        if(el.tagName.toLowerCase() === 'span' && el.querySelector('a')) {
             const anchor = el.querySelector('a')!;
             const iconSpan = el.querySelector('span[data-risk]') as HTMLElement;
             const risk = iconSpan?.dataset.risk;

             let Icon = Shield;
             let color = "text-gray-400";
             let tooltipText = "Risk Unknown";
 
             if (risk === 'low') {
                 Icon = ShieldCheck;
                 color = "text-green-500";
                 tooltipText = "This link is likely safe.";
             } else if (risk === 'medium') {
                 Icon = ShieldAlert;
                 color = "text-yellow-500";
                 tooltipText = "This link is potentially suspicious. Proceed with caution.";
             } else if (risk === 'high') {
                 Icon = ShieldAlert;
                 color = "text-red-500";
                 tooltipText = "This link is considered high-risk. Do not click.";
             }

             return (
                <span className="inline-flex items-center gap-1" key={index}>
                    <a href={anchor.href} target="_blank" rel="noopener noreferrer">{anchor.innerText}</a>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Icon className={cn("size-4 shrink-0", color)} />
                            </TooltipTrigger>
                            <TooltipContent>
                                <div className="flex items-center gap-2">
                                    <Icon className={cn("size-4", color)} />
                                    <p>{tooltipText}</p>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </span>
             );
        }

        return React.createElement(el.tagName.toLowerCase(), { key: index }, children);
      }
      return null;
    };
  
    return <div className="prose prose-sm dark:prose-invert max-w-none">{elements.map(toReactNode)}</div>;
  };


  return (
    <>
    <div className="h-full flex flex-col">
       <div className="p-4 border-b">
        <h1 className="text-3xl font-bold font-headline">Inbox</h1>
        <p className="text-muted-foreground">You have {inboxEmails.filter(e => e.unread).length} unread messages.</p>
       </div>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 overflow-hidden">
        <div className="col-span-1 border-r flex flex-col">
          <ScrollArea>
            <div className="flex flex-col">
              {inboxEmails.map((email) => (
                <button
                  key={email.id}
                  onClick={() => setSelectedEmail(email)}
                  className={cn(
                    'flex flex-col items-start gap-2 p-4 text-left text-sm transition-colors hover:bg-accent',
                    selectedEmail?.id === email.id && 'bg-accent'
                  )}
                >
                   <div className="flex w-full items-start gap-3">
                      <Avatar className="size-8">
                        <AvatarImage src={email.from.avatar} alt={email.from.name} />
                        <AvatarFallback>{email.from.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className={cn("font-semibold", email.unread && "font-bold")}>
                              {email.from.name}
                            </p>
                            <p className={cn(
                              "text-xs text-muted-foreground",
                              email.unread && "font-bold text-foreground"
                            )}>
                              {format(new Date(email.date), 'PP')}
                            </p>
                          </div>
                           <p className={cn("text-sm", email.unread && "font-bold")}>{email.subject}</p>
                           <p className="text-xs text-muted-foreground line-clamp-1">{email.snippet}</p>
                      </div>
                   </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
        <div className="col-span-1 md:col-span-2 lg:col-span-3 flex flex-col">
          {selectedEmail ? (
            <>
              <div className="flex items-center p-4 border-b gap-2 flex-wrap">
                 <Button onClick={handleAnalyzeClick}><Bot /> Analyze with AI</Button>
                 <Button onClick={handleSummarizeClick} variant="outline" disabled={summarizationState.status === 'loading'}><FileText /> Summarize</Button>
                <Separator orientation="vertical" className="h-6 mx-2 hidden md:block" />
                <Button variant="ghost" size="icon"><Reply /><span className="sr-only">Reply</span></Button>
                <Button variant="ghost" size="icon"><Archive /><span className="sr-only">Archive</span></Button>
                <Button variant="ghost" size="icon"><Trash /><span className="sr-only">Delete</span></Button>
                <Separator orientation="vertical" className="h-6 mx-2 hidden md:block" />
                <div className="flex items-center gap-2 text-sm text-muted-foreground ml-auto">
                  <Clock className="size-4" />
                  <span>{format(new Date(selectedEmail.date), 'PPP p')}</span>
                </div>
              </div>
              <ScrollArea className="flex-1 p-4 md:p-6">
                <h2 className="text-2xl font-bold font-headline mb-4">{selectedEmail.subject}</h2>
                <div className="flex items-center gap-4 mb-6">
                   <Avatar className="size-10">
                        <AvatarImage src={selectedEmail.from.avatar} alt={selectedEmail.from.name} />
                        <AvatarFallback>{selectedEmail.from.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">{selectedEmail.from.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedEmail.from.email}</p>
                    </div>
                </div>
                {renderProcessedBody()}
                {selectedEmail.tags && selectedEmail.tags.length > 0 && (
                    <div className="mt-6 flex gap-2">
                        {selectedEmail.tags.map(tag => (
                            <Badge key={tag} variant="secondary">{tag}</Badge>
                        ))}
                    </div>
                )}
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <MailIcon className="size-16 text-muted-foreground/50" />
              <h2 className="mt-4 text-xl font-semibold">No Email Selected</h2>
              <p className="mt-2 text-sm text-muted-foreground">Please select an email to view its content.</p>
            </div>
          )}
        </div>
      </div>
    </div>
    <AlertDialog open={isSummaryDialogOpen} onOpenChange={setIsSummaryDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <FileText /> Email Summary
            </AlertDialogTitle>
            <AlertDialogDescription>
              AI-generated summary of the selected email.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-[60vh] overflow-y-auto p-1">
            {summarizationState.status === 'loading' && (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            )}
            {summarizationState.status === 'error' && (
              <p className="text-destructive">{summarizationState.error}</p>
            )}
            {summarizationState.status === 'success' && summarizationState.result && (
              <div
                className="prose prose-sm dark:prose-invert"
                dangerouslySetInnerHTML={{
                  __html: summarizationState.result.summary.replace(/•/g, '<li>'),
                }}
              />
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
