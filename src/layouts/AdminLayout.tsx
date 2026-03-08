import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/AdminSidebar';

export default function AdminLayout() {
  return (
    <div className="admin-theme">
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AdminSidebar />
          <div className="flex-1 flex flex-col">
            <header className="h-14 flex items-center border-b border-border bg-card px-4">
              <SidebarTrigger className="mr-4" />
              <span className="font-heading text-lg font-semibold text-foreground">Admin Dashboard</span>
            </header>
            <main className="flex-1 p-6 overflow-auto bg-background">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}
