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
import VaultMonitoring from "./pages/admin/VaultMonitoring";
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
          <Routes>
            {/* Public routes - no ZapierStatusProvider */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route path="/reset-password" element={<PasswordReset />} />
            <Route path="/integrations/callback" element={<IntegrationCallback />} />
            <Route path="*" element={<NotFound />} />
            
            {/* Authenticated routes - wrapped with ZapierStatusProvider */}
            <Route path="/dashboard" element={
              <ZapierStatusProvider>
                <AuthGuard>
                  <SmartDashboard />
                </AuthGuard>
              </ZapierStatusProvider>
            } />
            <Route path="/integrations" element={
              <ZapierStatusProvider>
                <AuthGuard>
                  <UserIntegrations />
                </AuthGuard>
              </ZapierStatusProvider>
            } />
            <Route path="/analysis/:transcriptId" element={
              <ZapierStatusProvider>
                <AuthGuard>
                  <TranscriptAnalysis />
                </AuthGuard>
              </ZapierStatusProvider>
            } />
            
            {/* Admin routes - wrapped with ZapierStatusProvider */}
            <Route path="/admin" element={
              <ZapierStatusProvider>
                <AdminGuard>
                  <AdminDashboard />
                </AdminGuard>
              </ZapierStatusProvider>
            } />
            <Route path="/admin/prompts" element={
              <ZapierStatusProvider>
                <AdminGuard>
                  <PromptManagement />
                </AdminGuard>
              </ZapierStatusProvider>
            } />
            <Route path="/admin/users" element={
              <ZapierStatusProvider>
                <AdminGuard>
                  <UserManagement />
                </AdminGuard>
              </ZapierStatusProvider>
            } />
            <Route path="/admin/gdpr-compliance" element={
              <ZapierStatusProvider>
                <AdminGuard>
                  <GDPRCompliance />
                </AdminGuard>
              </ZapierStatusProvider>
            } />
            <Route path="/admin/integrations" element={
              <ZapierStatusProvider>
                <AdminGuard>
                  <AdminIntegrationDashboard />
                </AdminGuard>
              </ZapierStatusProvider>
            } />
            <Route path="/admin/integrations/callback" element={
              <ZapierStatusProvider>
                <AdminGuard>
                  <AdminIntegrationCallback />
                </AdminGuard>
              </ZapierStatusProvider>
            } />
            <Route path="/admin/vault-monitoring" element={
              <ZapierStatusProvider>
                <AdminGuard>
                  <VaultMonitoring />
                </AdminGuard>
              </ZapierStatusProvider>
            } />
          </Routes>
        </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App
