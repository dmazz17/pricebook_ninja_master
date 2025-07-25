import SidebarNav from '@/components/dashboard/sidebar-nav';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
        <SidebarNav />
        <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
