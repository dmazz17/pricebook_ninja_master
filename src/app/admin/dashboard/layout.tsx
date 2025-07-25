import AdminSidebarNav from '@/components/admin/sidebar-nav';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
};

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
        <AdminSidebarNav />
        <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
