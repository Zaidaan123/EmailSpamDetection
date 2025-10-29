
'use client';

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

import type { InboxEmail, SummarizationState } from '@/lib/types';
import { inboxEmails as initialEmails } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Archive, Bot, Clock, Loader2, Mail as MailIcon, Reply, Trash, FileText, Shield, ShieldCheck, ShieldAlert, Star } from 'lucide-react';
import { useDashboardState } from '@/hooks/use-dashboard-state';
import { summarizeEmailAction, analyzeUrlAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function Inbox() {
  const [emails, setEmails] = useState<InboxEmail[]>(initialEmails);
  const [selectedEmailIds, setSelectedEmailIds] = useState<Set<string>>(new Set());
  const [activeEmailId, setActiveEmailId] = useState<string | null>(initialEmails.find(e => e.status === 'inbox')?.id || null);

  const [summarizationState, setSummarizationState] = useState<SummarizationState>({ status: 'idle', result: null, error: null });
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
  const [processedEmailBody, setProcessedEmailBody] = useState<string | null>(null);

  const { setAnalyzeEmailFromInbox } = useDashboardState();
  const router = useRouter();
  const { toast } = useToast();

  const activeEmail = useMemo(() => emails.find(email => email.id === activeEmailId), [emails, activeEmailId]);
  const inboxViewEmails = useMemo(() => emails.filter(e => e.status === 'inbox'), [emails]);

  useEffect(() => {
    if (activeEmail) {
      setProcessedEmailBody(null); // Reset while processing
      const processEmailBody = async () => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(activeEmail.body, 'text/html');
        const links = Array.from(doc.querySelectorAll('a'));
        
        if (links.length === 0) {
          setProcessedEmailBody(activeEmail.body);
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
  }, [activeEmail]);

  const handleAnalyzeClick = () => {
    if (activeEmail) {
      const urlRegex = /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/g;
      const urls = [];
      let match;
      while ((match = urlRegex.exec(activeEmail.body)) !== null) {
        urls.push(match[2]);
      }
      
      const emailDataForAnalysis = {
        emailSubject: activeEmail.subject,
        senderDomain: activeEmail.from.email.split('@')[1] || 'unknown.com',
        senderIp: '127.0.0.1', 
        emailBody: activeEmail.body,
        urlList: urls,
      };

      setAnalyzeEmailFromInbox(emailDataForAnalysis);
      router.push('/');
    }
  };

  const handleSummarizeClick = async () => {
    if (!activeEmail) return;

    setSummarizationState({ status: 'loading', result: null, error: null });
    setIsSummaryDialogOpen(true);

    const { data, error } = await summarizeEmailAction({ emailBody: activeEmail.body });

    if (error) {
      setSummarizationState({ status: 'error', result: null, error });
    } else {
      setSummarizationState({ status: 'success', result: data, error: null });
    }
  }

  const toggleSelection = (emailId: string) => {
    setSelectedEmailIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(emailId)) {
        newSet.delete(emailId);
      } else {
        newSet.add(emailId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedEmailIds.size === inboxViewEmails.length) {
      setSelectedEmailIds(new Set());
    } else {
      setSelectedEmailIds(new Set(inboxViewEmails.map(e => e.id)));
    }
  };

  const toggleStarred = (e: React.MouseEvent, emailId: string) => {
    e.stopPropagation();
    setEmails(emails.map(email => 
      email.id === emailId ? { ...email, starred: !email.starred } : email
    ));
  };
  
  const moveSelectedToTrash = () => {
    setEmails(emails.map(email => 
      selectedEmailIds.has(email.id) ? { ...email, status: 'trash' } : email
    ));
    const newActiveEmail = emails.find(e => e.status === 'inbox' && !selectedEmailIds.has(e.id));
    setActiveEmailId(newActiveEmail?.id || null);
    setSelectedEmailIds(new Set());
    toast({ title: `${selectedEmailIds.size} conversation(s) moved to the bin.`});
  };

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
        <div className="p-4 border-b flex items-center justify-between gap-2">
          <div>
            <h1 className="text-3xl font-bold font-headline">Inbox</h1>
            <p className="text-muted-foreground">You have {inboxViewEmails.filter(e => e.unread).length} unread messages.</p>
          </div>
          {selectedEmailIds.size > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={moveSelectedToTrash}>
                    <Trash className="size-5" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 overflow-hidden">
          <div className="col-span-1 border-r flex flex-col">
            <div className="p-2 border-b">
              <div className="flex items-center gap-2 p-2">
                <Checkbox
                  id="select-all"
                  checked={selectedEmailIds.size === inboxViewEmails.length && inboxViewEmails.length > 0}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all"
                />
                <label htmlFor="select-all" className="text-sm font-medium">Select All</label>
              </div>
            </div>
            <ScrollArea>
              <div className="flex flex-col">
                {inboxViewEmails.map((email) => (
                  <div
                    key={email.id}
                    onClick={() => setActiveEmailId(email.id)}
                    className={cn(
                      'flex items-start gap-2 p-3 text-left text-sm transition-colors cursor-pointer border-b',
                      'hover:bg-accent',
                      activeEmailId === email.id && 'bg-accent',
                      email.unread && 'bg-primary/5'
                    )}
                  >
                    <div className="flex items-center gap-3 pt-1">
                      <Checkbox
                        checked={selectedEmailIds.has(email.id)}
                        onCheckedChange={() => toggleSelection(email.id)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select email from ${email.from.name}`}
                      />
                      <button onClick={(e) => toggleStarred(e, email.id)}>
                        <Star className={cn("size-4", email.starred ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground')} />
                      </button>
                    </div>
                    <div className="flex-1 overflow-hidden" onClick={() => setActiveEmailId(email.id)}>
                        <div className="flex items-center justify-between">
                          <p className={cn("font-semibold truncate", email.unread && "font-bold")}>
                            {email.from.name}
                          </p>
                          <p className={cn("text-xs text-muted-foreground", email.unread && "font-bold text-foreground")}>
                            {format(new Date(email.date), 'PP')}
                          </p>
                        </div>
                         <p className={cn("text-sm truncate", email.unread && "font-bold")}>{email.subject}</p>
                         <p className="text-xs text-muted-foreground line-clamp-1">{email.snippet}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          <div className="col-span-1 md:col-span-2 lg:col-span-3 flex flex-col">
            {activeEmail ? (
              <>
                <div className="flex items-center p-4 border-b gap-2 flex-wrap">
                   <Button onClick={handleAnalyzeClick}><Bot /> Analyze with AI</Button>
                   <Button onClick={handleSummarizeClick} variant="outline" disabled={summarizationState.status === 'loading'}><FileText /> Summarize</Button>
                  <Separator orientation="vertical" className="h-6 mx-2 hidden md:block" />
                  <Button variant="ghost" size="icon"><Reply /><span className="sr-only">Reply</span></Button>
                  <Button variant="ghost" size="icon"><Archive /><span className="sr-only">Archive</span></Button>
                  <Separator orientation="vertical" className="h-6 mx-2 hidden md:block" />
                  <div className="flex items-center gap-2 text-sm text-muted-foreground ml-auto">
                    <Clock className="size-4" />
                    <span>{format(new Date(activeEmail.date), 'PPP p')}</span>
                  </div>
                </div>
                <ScrollArea className="flex-1 p-4 md:p-6">
                  <div className="flex justify-between items-start">
                    <h2 className="text-2xl font-bold font-headline mb-4">{activeEmail.subject}</h2>
                    <button onClick={(e) => toggleStarred(e, activeEmail.id)}>
                        <Star className={cn("size-5", activeEmail.starred ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground hover:text-yellow-400')} />
                    </button>
                  </div>
                  <div className="flex items-center gap-4 mb-6">
                     <Avatar className="size-10">
                          <AvatarImage src={activeEmail.from.avatar} alt={activeEmail.from.name} />
                          <AvatarFallback>{activeEmail.from.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                          <p className="font-semibold">{activeEmail.from.name}</p>
                          <p className="text-sm text-muted-foreground">{activeEmail.from.email}</p>
                      </div>
                  </div>
                  {renderProcessedBody()}
                  {activeEmail.tags && activeEmail.tags.length > 0 && (
                      <div className="mt-6 flex gap-2">
                          {activeEmail.tags.map(tag => (
                              <Badge key={tag} variant="secondary">{tag}</Badge>
                          ))}
                      </div>
                  )}
                </ScrollArea>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <MailIcon className="size-16 text-muted-foreground/50" />
                <h2 className="mt-4 text-xl font-semibold">No Email Selected</h2>
                <p className="mt-2 text-sm text-muted-foreground">{inboxViewEmails.length > 0 ? "Please select an email to view its content." : "Your inbox is empty."}</p>
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