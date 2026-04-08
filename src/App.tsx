import { lazy, Suspense } from 'react'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import LoadingScreen from "@/components/LoadingScreen";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useEffect, useRef } from "react";

const Auth                = lazy(() => import('./pages/Auth'))
const AuthCallback        = lazy(() => import('./pages/AuthCallback'))
const Home                = lazy(() => import('./pages/Home'))
const Admin               = lazy(() => import('./pages/Admin'))
const PollaView           = lazy(() => import('./pages/PollaView'))
const Predicciones        = lazy(() => import('./pages/Predicciones'))
const Posiciones          = lazy(() => import('./pages/Posiciones'))
const Perfil              = lazy(() => import('./pages/Perfil'))
const SuperAdmin          = lazy(() => import('./pages/SuperAdmin'))
const SuperAdminLogin     = lazy(() => import('./pages/SuperAdminLogin'))
const ClientAdmin         = lazy(() => import('./pages/ClientAdmin'))
const ClientAdminLogin    = lazy(() => import('./pages/ClientAdminLogin'))
const ClientAdminRegister = lazy(() => import('./pages/ClientAdminRegister'))
const NotFound            = lazy(() => import('./pages/NotFound'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
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
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                {/* Públicas */}
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/callback" element={<AuthCallback />} />

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
                    <ErrorBoundary>
                      <ProtectedRoute>
                        <Admin />
                      </ProtectedRoute>
                    </ErrorBoundary>
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

                {/* Super admin */}
                <Route path="/superadmin/login" element={<SuperAdminLogin />} />
                <Route
                  path="/superadmin"
                  element={
                    <ProtectedRoute redirectTo="/superadmin/login">
                      <SuperAdmin />
                    </ProtectedRoute>
                  }
                />

                {/* Cliente Admin */}
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
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
