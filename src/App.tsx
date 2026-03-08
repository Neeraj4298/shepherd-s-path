import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PendingApprovalPage from "./pages/PendingApprovalPage";
import UserLayout from "./layouts/UserLayout";
import AdminLayout from "./layouts/AdminLayout";
import DashboardHome from "./pages/dashboard/DashboardHome";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminUsers from "./pages/admin/AdminUsers";
import PlaceholderPage from "./pages/PlaceholderPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/pending" element={<PendingApprovalPage />} />

            {/* User Dashboard */}
            <Route path="/dashboard" element={<ProtectedRoute><UserLayout /></ProtectedRoute>}>
              <Route index element={<DashboardHome />} />
              <Route path="bible" element={<PlaceholderPage title="Bible Study Tracker" />} />
              <Route path="plans" element={<PlaceholderPage title="Study Plans" />} />
              <Route path="groups" element={<PlaceholderPage title="Study Groups" />} />
              <Route path="prayer" element={<PlaceholderPage title="Prayer Room" />} />
              <Route path="testimonies" element={<PlaceholderPage title="Testimonies" />} />
              <Route path="chat" element={<PlaceholderPage title="Chat Rooms" />} />
              <Route path="guidance" element={<PlaceholderPage title="Guidance & Support" />} />
              <Route path="recovery" element={<PlaceholderPage title="Addiction Recovery" />} />
              <Route path="fruits" element={<PlaceholderPage title="Fruits of the Spirit" />} />
              <Route path="profile" element={<PlaceholderPage title="Profile" />} />
              <Route path="notifications" element={<PlaceholderPage title="Notifications" />} />
            </Route>

            {/* Admin Dashboard */}
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminLayout /></ProtectedRoute>}>
              <Route index element={<AdminOverview />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="testimonies" element={<PlaceholderPage title="Testimony Moderation" />} />
              <Route path="prayers" element={<PlaceholderPage title="Prayer Moderation" />} />
              <Route path="groups" element={<PlaceholderPage title="Group Management" />} />
              <Route path="plans" element={<PlaceholderPage title="Study Plan Management" />} />
              <Route path="chat" element={<PlaceholderPage title="Chat Moderation" />} />
              <Route path="guidance" element={<PlaceholderPage title="Guidance Management" />} />
              <Route path="recovery" element={<PlaceholderPage title="Recovery Content" />} />
              <Route path="announcements" element={<PlaceholderPage title="Announcements" />} />
              <Route path="analytics" element={<PlaceholderPage title="Analytics" />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
