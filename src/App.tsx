import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import { useEffect, useRef } from "react";

import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import PollaView from "./pages/PollaView";
import Predicciones from "./pages/Predicciones";
import Posiciones from "./pages/Posiciones";
import Perfil from "./pages/Perfil";
import SuperAdmin from "./pages/SuperAdmin";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import ClientAdmin from "./pages/ClientAdmin";
import ClientAdminLogin from "./pages/ClientAdminLogin";
import ClientAdminRegister from "./pages/ClientAdminRegister";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 segundos
      retry: 1,
    },
  },
});

function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.opacity = '0'
    el.style.transform = 'translateY(8px)'
    requestAnimationFrame(() => {
      el.style.transition = 'opacity 220ms ease, transform 220ms ease'
      el.style.opacity = '1'
      el.style.transform = 'translateY(0)'
    })
  }, [location.pathname])

  return <div ref={ref}>{children}</div>
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Pública */}
            <Route path="/auth" element={<Auth />} />

            {/* Protegidas */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <PageTransition><Home /></PageTransition>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/perfil"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <PageTransition><Perfil /></PageTransition>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/:pollaId"
              element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/polla/:pollaId"
              element={
                <ProtectedRoute>
                  <PollaView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/polla/:pollaId/predicciones"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <PageTransition><Predicciones /></PageTransition>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/polla/:pollaId/posiciones"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <PageTransition><Posiciones /></PageTransition>
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Super admin — login propio y panel */}
            <Route path="/superadmin/login" element={<SuperAdminLogin />} />
            <Route
              path="/superadmin"
              element={
                <ProtectedRoute redirectTo="/superadmin/login">
                  <SuperAdmin />
                </ProtectedRoute>
              }
            />

            {/* Cliente Admin — registro con código y panel */}
            <Route path="/client-admin/register" element={<ClientAdminRegister />} />
            <Route path="/client-admin/login" element={<ClientAdminLogin />} />
            <Route
              path="/client-admin"
              element={
                <ProtectedRoute redirectTo="/client-admin/login">
                  <ClientAdmin />
                </ProtectedRoute>
              }
            />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
