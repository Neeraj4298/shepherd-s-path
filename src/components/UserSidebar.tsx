import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import {
  BookOpen, Home, BookMarked, Users, Heart, MessageSquare,
  HandHelping, Apple, Compass, Bell, User, LogOut, GraduationCap,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const navItems = [
  { title: 'Home', url: '/dashboard', icon: Home },
  { title: 'Bible Study', url: '/dashboard/bible', icon: BookMarked },
  { title: 'Study Plans', url: '/dashboard/plans', icon: GraduationCap },
  { title: 'Study Groups', url: '/dashboard/groups', icon: Users },
  { title: 'Prayer Room', url: '/dashboard/prayer', icon: Heart },
  { title: 'Testimonies', url: '/dashboard/testimonies', icon: MessageSquare },
  { title: 'Chat Rooms', url: '/dashboard/chat', icon: MessageSquare },
  { title: 'Guidance', url: '/dashboard/guidance', icon: Compass },
  { title: 'Recovery', url: '/dashboard/recovery', icon: HandHelping },
  { title: 'Fruits of Spirit', url: '/dashboard/fruits', icon: Apple },
  { title: 'Profile', url: '/dashboard/profile', icon: User },
  { title: 'Notifications', url: '/dashboard/notifications', icon: Bell },
];

export function UserSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { signOut, profile } = useAuth();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Brand */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
          <BookOpen className="h-7 w-7 text-sidebar-primary shrink-0" />
          {!collapsed && (
            <span className="font-heading text-lg font-bold text-sidebar-foreground">
              Shepherd Hub
            </span>
          )}
        </div>

        {/* User info */}
        {!collapsed && profile && (
          <div className="px-4 py-3 border-b border-sidebar-border">
            <p className="text-sm font-semibold text-sidebar-foreground font-body truncate">{profile.full_name}</p>
            <p className="text-xs text-sidebar-foreground/60 font-body">Member</p>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/dashboard'}
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

        {/* Sign out */}
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
