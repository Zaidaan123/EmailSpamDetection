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
import { GuardianMailDashboard } from '@/components/guardian-mail/dashboard';
import { Logo } from '@/components/guardian-mail/logo';
import { Bot, LayoutDashboard, LogOut, Mail, Settings, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth, useUser } from '@/firebase';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);

  if (isUserLoading || !user) {
    return (
       <div className="flex h-screen w-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Logo />
            <Skeleton className="h-8 w-48" />
            <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
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
              <SidebarMenuButton tooltip="Dashboard" isActive>
                <LayoutDashboard />
                <span className="font-headline">Dashboard</span>
              </SidebarMenuButton>
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
              <SidebarMenuButton tooltip="AI Settings">
                <Bot />
                <span className="font-headline">AI Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Settings">
                <Settings />
                <span className="font-headline">Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip={user.email || 'Account'}>
                <UserCircle />
                <span className="font-headline truncate">{user.email || 'Account'}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton tooltip="Logout" onClick={() => auth.signOut()}>
                <LogOut />
                <span className="font-headline">Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <GuardianMailDashboard />
      </SidebarInset>
    </SidebarProvider>
  );
}
