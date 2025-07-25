
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Building, CreditCard, Settings, Users } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';

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

export default function AdminSidebarNav() {
  const pathname = usePathname();

  const isDashboardActive = pathname === '/admin/dashboard';
  const isCompaniesActive = pathname.startsWith('/admin/dashboard/companies');
  const isCustomersActive = pathname.startsWith('/admin/dashboard/customers');
  const isPaymentsActive = pathname.startsWith('/admin/dashboard/payments');
  const isSettingsActive = pathname.startsWith('/admin/dashboard/settings');

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
              <Link href="/admin/dashboard">
                <LayoutDashboard />
                <span className="group-data-[collapsible=icon]:hidden">Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isCompaniesActive} tooltip="Companies">
              <Link href="/admin/dashboard/companies">
                <Building />
                <span className="group-data-[collapsible=icon]:hidden">Companies</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isCustomersActive} tooltip="Customers">
              <Link href="/admin/dashboard/customers">
                <Users />
                <span className="group-data-[collapsible=icon]:hidden">Customers</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isPaymentsActive} tooltip="Payments">
              <Link href="/admin/dashboard/payments">
                <CreditCard />
                <span className="group-data-[collapsible=icon]:hidden">Payments</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isSettingsActive} tooltip="Settings">
              <Link href="/admin/dashboard/settings">
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
