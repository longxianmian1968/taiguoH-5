import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/contexts/I18nContext";
import NotFound from "@/pages/not-found";

// H5 Frontend Pages
import HomePage from "@/pages/home";
import BrandPage from "@/pages/brand";
import ProfilePage from "@/pages/profile";
import ActivityDetailPage from "@/pages/activity-detail";
import GroupSharePage from "@/pages/group-share";
import VerifyPage from "@/pages/verify";
import LineBindingPage from "@/pages/LineBinding";
import { BottomNav } from "@/components/ui/bottom-nav";

// Admin Backend Pages
import AdminLoginPage from "@/pages/admin/login";
import SimpleDashboard from "@/pages/admin/simple-dashboard";
import SimpleActivitiesPage from "@/pages/admin/simple-activities";
import SimpleStoresPage from "@/pages/admin/simple-stores";
import AdminStaffPage from "@/pages/admin/staff";
import AdminRedeemsPage from "@/pages/admin/redeems";
import AdminStatisticsPage from "@/pages/admin/statistics";
import I18nPage from "@/pages/admin/i18n";
import { AdminGuard } from "@/components/AdminGuard";

function AppWithNav() {
  return (
    <>
      <Router />
      <ConditionalBottomNav />
    </>
  );
}

function ConditionalBottomNav() {
  const [location] = useLocation();
  const isAdminRoute = location.startsWith('/admin');
  const showBottomNav = !isAdminRoute && location !== '/verify' && location !== '/line-binding';

  return showBottomNav ? <BottomNav /> : null;
}

function Router() {
  return (
    <Switch>
      {/* Admin Backend Routes - 放在最前面确保优先匹配 */}
      <Route path="/admin/login">
        <AdminLoginPage />
      </Route>
      <Route path="/admin/dashboard">
        <AdminGuard>
          <SimpleDashboard />
        </AdminGuard>
      </Route>
      <Route path="/admin/activities">
        <AdminGuard>
          <SimpleActivitiesPage />
        </AdminGuard>
      </Route>
      <Route path="/admin/stores">
        <AdminGuard>
          <SimpleStoresPage />
        </AdminGuard>
      </Route>
      <Route path="/admin/staff">
        <AdminGuard>
          <AdminStaffPage />
        </AdminGuard>
      </Route>
      <Route path="/admin/redeems">
        <AdminGuard>
          <AdminRedeemsPage />
        </AdminGuard>
      </Route>
      <Route path="/admin/statistics">
        <AdminGuard>
          <AdminStatisticsPage />
        </AdminGuard>
      </Route>
      <Route path="/admin/i18n">
        <AdminGuard>
          <I18nPage />
        </AdminGuard>
      </Route>
      <Route path="/admin">
        <AdminGuard>
          <SimpleDashboard />
        </AdminGuard>
      </Route>
      
      {/* H5 Frontend Routes */}
      <Route path="/" component={HomePage} />
      <Route path="/home" component={HomePage} />
      <Route path="/brand" component={BrandPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/a/:id" component={ActivityDetailPage} />
      <Route path="/activities/:id" component={ActivityDetailPage} />
      <Route path="/group-share/:id" component={GroupSharePage} />
      <Route path="/verify" component={VerifyPage} />
      <Route path="/line-binding" component={LineBindingPage} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <TooltipProvider>
          <Toaster />
          <AppWithNav />
        </TooltipProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

export default App;
