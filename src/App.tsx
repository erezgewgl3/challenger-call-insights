import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AdminGuard } from "@/components/auth/AdminGuard";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import Index from "./pages/Index";
import SmartDashboard from "./pages/SmartDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import PromptManagement from "./pages/PromptManagement";
import UserManagement from "./pages/admin/UserManagement";
import GDPRCompliance from "./pages/admin/GDPRCompliance";
import NotFound from "./pages/NotFound";
import { ZapierStatusProvider } from "@/contexts/ZapierStatusContext";
import TranscriptAnalysis from "./pages/TranscriptAnalysis";
import PasswordReset from "./pages/PasswordReset";
import IntegrationCallback from "./pages/IntegrationCallback";
import AdminIntegrationCallback from "./pages/AdminIntegrationCallback";
import UserIntegrations from "./pages/UserIntegrations";
import AdminIntegrationDashboard from "./pages/admin/AdminIntegrationDashboard";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
        <BrowserRouter>
          <ZapierStatusProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<LoginForm />} />
              <Route path="/register" element={<RegisterForm />} />
              <Route path="/reset-password" element={<PasswordReset />} />
              <Route path="/dashboard" element={
                <AuthGuard>
                  <SmartDashboard />
                </AuthGuard>
              } />
              <Route path="/integrations" element={
                <AuthGuard>
                  <UserIntegrations />
                </AuthGuard>
              } />
              <Route path="/admin" element={
                <AdminGuard>
                  <AdminDashboard />
                </AdminGuard>
              } />
              <Route path="/admin/prompts" element={
                <AdminGuard>
                  <PromptManagement />
                </AdminGuard>
              } />
              <Route path="/admin/users" element={
                <AdminGuard>
                  <UserManagement />
                </AdminGuard>
              } />
              <Route path="/admin/gdpr-compliance" element={
                <AdminGuard>
                  <GDPRCompliance />
                </AdminGuard>
              } />
              <Route path="/admin/integrations" element={
                <AdminGuard>
                  <AdminIntegrationDashboard />
                </AdminGuard>
              } />
              <Route path="/analysis/:transcriptId" element={
                <AuthGuard>
                  <TranscriptAnalysis />
                </AuthGuard>
              } />
              <Route path="/integrations/callback" element={<IntegrationCallback />} />
              <Route path="/admin/integrations/callback" element={
                <AdminGuard>
                  <AdminIntegrationCallback />
                </AdminGuard>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ZapierStatusProvider>
        </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App
