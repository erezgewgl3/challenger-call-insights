
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
import WelcomeDashboard from "./pages/WelcomeDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import PromptManagement from "./pages/PromptManagement";
import UserManagement from "./pages/admin/UserManagement";
import NotFound from "./pages/NotFound";
import TranscriptAnalysis from "./pages/TranscriptAnalysis";

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
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<LoginForm />} />
              <Route path="/register" element={<RegisterForm />} />
              <Route path="/dashboard" element={
                <AuthGuard>
                  <WelcomeDashboard />
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
              <Route path="/analysis/:transcriptId" element={
                <AuthGuard>
                  <TranscriptAnalysis />
                </AuthGuard>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App
