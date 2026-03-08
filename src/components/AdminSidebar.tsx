import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import {
  BookOpen, LayoutDashboard, Users, MessageSquare, Heart,
  Shield, GraduationCap, Megaphone, BarChart3, Settings,
  HandHelping, Compass, LogOut,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const adminItems = [
  { title: 'Overview', url: '/admin', icon: LayoutDashboard },
  { title: 'Users', url: '/admin/users', icon: Users },
  { title: 'Testimonies', url: '/admin/testimonies', icon: MessageSquare },
  { title: 'Prayers', url: '/admin/prayers', icon: Heart },
  { title: 'Groups', url: '/admin/groups', icon: Users },
  { title: 'Study Plans', url: '/admin/plans', icon: GraduationCap },
  { title: 'Chat', url: '/admin/chat', icon: MessageSquare },
  { title: 'Guidance', url: '/admin/guidance', icon: Compass },
  { title: 'Recovery', url: '/admin/recovery', icon: HandHelping },
  { title: 'Announcements', url: '/admin/announcements', icon: Megaphone },
  { title: 'Analytics', url: '/admin/analytics', icon: BarChart3 },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { signOut } = useAuth();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Brand */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
          <Shield className="h-7 w-7 text-sidebar-primary shrink-0" />
          {!collapsed && (
            <span className="font-heading text-lg font-bold text-sidebar-foreground">
              Admin Panel
            </span>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50">Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/admin'}
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-4 border-t border-sidebar-border">
          <button
            onClick={signOut}
            className="flex items-center gap-2 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground font-body w-full"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
