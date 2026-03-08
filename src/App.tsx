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

// User pages
import DashboardHome from "./pages/dashboard/DashboardHome";
import BibleStudyTracker from "./pages/dashboard/BibleStudyTracker";
import StudyPlansPage from "./pages/dashboard/StudyPlansPage";
import StudyGroupsPage from "./pages/dashboard/StudyGroupsPage";
import PrayerRoom from "./pages/dashboard/PrayerRoom";
import TestimoniesPage from "./pages/dashboard/TestimoniesPage";
import ChatRoomsPage from "./pages/dashboard/ChatRoomsPage";
import GuidancePage from "./pages/dashboard/GuidancePage";
import AddictionRecoveryPage from "./pages/dashboard/AddictionRecoveryPage";
import FruitsOfSpiritPage from "./pages/dashboard/FruitsOfSpiritPage";
import ProfilePage from "./pages/dashboard/ProfilePage";
import NotificationsPage from "./pages/dashboard/NotificationsPage";

// Admin pages
import AdminOverview from "./pages/admin/AdminOverview";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminTestimonies from "./pages/admin/AdminTestimonies";
import AdminPrayers from "./pages/admin/AdminPrayers";
import AdminGroups from "./pages/admin/AdminGroups";
import AdminPlans from "./pages/admin/AdminPlans";
import AdminChat from "./pages/admin/AdminChat";
import AdminGuidance from "./pages/admin/AdminGuidance";
import AdminRecovery from "./pages/admin/AdminRecovery";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";
import AdminAnalytics from "./pages/admin/AdminAnalytics";

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
              <Route path="bible" element={<BibleStudyTracker />} />
              <Route path="plans" element={<StudyPlansPage />} />
              <Route path="groups" element={<StudyGroupsPage />} />
              <Route path="prayer" element={<PrayerRoom />} />
              <Route path="testimonies" element={<TestimoniesPage />} />
              <Route path="chat" element={<ChatRoomsPage />} />
              <Route path="guidance" element={<GuidancePage />} />
              <Route path="recovery" element={<AddictionRecoveryPage />} />
              <Route path="fruits" element={<FruitsOfSpiritPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="notifications" element={<NotificationsPage />} />
            </Route>

            {/* Admin Dashboard */}
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminLayout /></ProtectedRoute>}>
              <Route index element={<AdminOverview />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="testimonies" element={<AdminTestimonies />} />
              <Route path="prayers" element={<AdminPrayers />} />
              <Route path="groups" element={<AdminGroups />} />
              <Route path="plans" element={<AdminPlans />} />
              <Route path="chat" element={<AdminChat />} />
              <Route path="guidance" element={<AdminGuidance />} />
              <Route path="recovery" element={<AdminRecovery />} />
              <Route path="announcements" element={<AdminAnnouncements />} />
              <Route path="analytics" element={<AdminAnalytics />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
