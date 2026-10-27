import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router'
import { queryClient } from '@/api/queryClient'
import { AuthProvider } from '@/auth/AuthProvider'
import { HomeRedirect, RequireRole } from '@/auth/guards'
import { LoginPage } from '@/features/auth/LoginPage'
import { RoleHomePage } from '@/features/home/RoleHomePage'
import { NotFoundPage } from '@/features/NotFoundPage'
import { StaffLayout } from '@/layouts/StaffLayout'

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<LoginPage />} />

            <Route element={<RequireRole roles={['teller']} />}>
              <Route element={<StaffLayout />}>
                <Route path="/teller" element={<RoleHomePage />} />
              </Route>
            </Route>

            <Route element={<RequireRole roles={['supervisor']} />}>
              <Route element={<StaffLayout />}>
                <Route path="/supervisor" element={<RoleHomePage />} />
              </Route>
            </Route>

            <Route element={<RequireRole roles={['admin']} />}>
              <Route element={<StaffLayout />}>
                <Route path="/admin" element={<RoleHomePage />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
