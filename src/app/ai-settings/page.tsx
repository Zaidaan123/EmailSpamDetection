'use client';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/guardian-mail/logo';
import { Bot, LayoutDashboard, LogOut, Mail, Send, ShieldAlert, Settings, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth, useUser } from '@/firebase';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeToggle } from '@/components/theme-toggle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function AiSettingsPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // Mock state for AI settings
  const [sensitivity, setSensitivity] = useState([50]);
  const [replyTone, setReplyTone] = useState('neutral');

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);

  const handleSaveChanges = () => {
    toast({
        title: 'Settings Saved',
        description: 'Your AI settings have been updated (simulation).',
    })
  }

  if (isUserLoading || !user) {
     return (
       <div className="flex h-screen w-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Logo />
            <Skeleton className="h-8 w-48" />
            <p className="text-sm text-muted-foreground">Loading AI Settings...</p>
          </div>
       </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/">
                <SidebarMenuButton tooltip="Dashboard">
                  <LayoutDashboard />
                  <span className="font-headline">Dashboard</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/inbox">
                <SidebarMenuButton tooltip="Inbox">
                  <Mail />
                  <span className="font-headline">Inbox</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <Link href="/sent">
                <SidebarMenuButton tooltip="Sent">
                  <Send />
                  <span className="font-headline">Sent</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/spam">
                <SidebarMenuButton tooltip="Spam">
                  <ShieldAlert />
                  <span className="font-headline">Spam</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton tooltip="AI Settings" isActive>
                  <Bot />
                  <span className="font-headline">AI Settings</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/">
                <SidebarMenuButton tooltip="Settings">
                  <Settings />
                  <span className="font-headline">Settings</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
               <Link href="/profile">
                <SidebarMenuButton tooltip={user.email || 'Account'}>
                    <UserCircle />
                    <span className="font-headline truncate">{user.email || 'Account'}</span>
                </SidebarMenuButton>
               </Link>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton tooltip="Logout" onClick={() => auth.signOut()}>
                <LogOut />
                <span className="font-headline">Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <div className="flex justify-center">
                    <ThemeToggle />
                </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="p-4 md:p-8">
            <h1 className="text-3xl font-bold font-headline mb-8">AI Settings</h1>
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Fine-Tune Your AI Assistant</CardTitle>
                    <CardDescription>Adjust the behavior of GuardianMail's AI to fit your preferences.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="space-y-4">
                        <Label htmlFor="sensitivity" className="text-base font-semibold">Phishing Detection Sensitivity</Label>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground">Less Strict</span>
                            <Slider
                                id="sensitivity"
                                value={sensitivity}
                                onValueChange={setSensitivity}
                                max={100}
                                step={1}
                                className="flex-1"
                            />
                            <span className="text-sm text-muted-foreground">More Strict</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Adjust how aggressively the AI flags potential phishing emails. Higher sensitivity may result in more false positives.
                        </p>
                    </div>

                     <div className="space-y-4">
                        <Label className="text-base font-semibold">AI-Assisted Reply Tone</Label>
                        <RadioGroup value={replyTone} onValueChange={setReplyTone} className="flex flex-col sm:flex-row gap-4">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="formal" id="formal" />
                                <Label htmlFor="formal">Formal</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="neutral" id="neutral" />
                                <Label htmlFor="neutral">Neutral</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="casual" id="casual" />
                                <Label htmlFor="casual">Casual</Label>
                            </div>
                        </RadioGroup>
                         <p className="text-xs text-muted-foreground">
                            Choose the default tone for AI-generated email replies.
                        </p>
                    </div>
                    <Button onClick={handleSaveChanges}>Save Changes</Button>
                </CardContent>
            </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
