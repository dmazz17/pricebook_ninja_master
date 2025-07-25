
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BookCopy, ShoppingBag, Settings } from 'lucide-react';
import { UserButton, useUser } from '@clerk/nextjs';

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import Image from 'next/image';


export default function SidebarNavContent() {
  const pathname = usePathname();

  const isDashboardActive = pathname === '/dashboard' || pathname.startsWith('/dashboard/project/');
  const isPricebookSpecsActive = pathname.startsWith('/dashboard/pricebook-specs');
  const isPurchasesActive = pathname.startsWith('/dashboard/purchases');
  const isSettingsActive = pathname.startsWith('/dashboard/settings');

  return (
    <Sidebar collapsible="icon">
      <SidebarRail />
      <SidebarHeader>
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center gap-2.5 group-data-[collapsible=icon]:flex-grow group-data-[collapsible=icon]:justify-center">
            <Image src="https://i.postimg.cc/B62PJxtg/PN-Logo-2.png" alt="Pricebook Ninjas Logo" width={40} height={40} className="w-auto h-10 text-white shrink-0" />
            <div className="group-data-[collapsible=icon]:hidden">
                <p className="font-bold text-sm text-white leading-tight">PRICEBOOK</p>
                <p className="font-bold text-sm text-white leading-tight">NINJAS</p>
            </div>
          </div>
          <SidebarTrigger className="group-data-[collapsible=icon]:hidden" />
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isDashboardActive} tooltip="Dashboard">
              <Link href="/dashboard">
                <LayoutDashboard />
                <span className="group-data-[collapsible=icon]:hidden">Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isPricebookSpecsActive} tooltip="Pricebook Specs">
              <Link href="/dashboard/pricebook-specs">
                <BookCopy />
                <span className="group-data-[collapsible=icon]:hidden">Pricebook Specs</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isPurchasesActive} tooltip="Purchases">
              <Link href="/dashboard/purchases">
                <ShoppingBag />
                <span className="group-data-[collapsible=icon]:hidden">Purchases</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isSettingsActive} tooltip="Settings">
              <Link href="/dashboard/settings">
                <Settings />
                <span className="group-data-[collapsible=icon]:hidden">Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2 flex justify-center">
        <UserButton afterSignOutUrl="/"/>
      </SidebarFooter>
    </Sidebar>
  );
}
