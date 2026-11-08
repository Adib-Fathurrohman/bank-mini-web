import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router'
import { queryClient } from '@/api/queryClient'
import { AuthProvider } from '@/auth/AuthProvider'
import { HomeRedirect, RequireRole } from '@/auth/guards'
import { AdminDashboard } from '@/features/admin/AdminDashboard'
import { CustomerCardPage } from '@/features/admin/CustomerCardPage'
import { CustomerFormPage } from '@/features/admin/CustomerFormPage'
import { GraduationPage } from '@/features/admin/GraduationPage'
import { SettingsPage } from '@/features/admin/SettingsPage'
import { StaffFormPage } from '@/features/admin/StaffFormPage'
import { StaffImportPage } from '@/features/admin/StaffImportPage'
import { CustomerImportPage } from '@/features/admin/CustomerImportPage'
import { AuditLogPage } from '@/features/audit/AuditLogPage'
import { AuditTransactionPage } from '@/features/audit/AuditTransactionPage'
import { ExportsPage } from '@/features/audit/ExportsPage'
import { JournalPage } from '@/features/audit/JournalPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { CustomerDetailPage } from '@/features/directory/CustomerDetailPage'
import { CustomersPage } from '@/features/directory/CustomersPage'
import { StaffDetailPage } from '@/features/directory/StaffDetailPage'
import { StaffPage } from '@/features/directory/StaffPage'
import { NotFoundPage } from '@/features/NotFoundPage'
import { CloseShiftPage } from '@/features/teller/CloseShiftPage'
import { CounterPage } from '@/features/teller/CounterPage'
import { ShiftDetailPage } from '@/features/teller/ShiftDetailPage'
import { ShiftHistoryPage } from '@/features/teller/ShiftHistoryPage'
import { TellerHomePage } from '@/features/teller/TellerHomePage'
import { TellerLayout } from '@/features/teller/TellerLayout'
import { TransactionsPage } from '@/features/teller/TransactionsPage'
import { ReportReviewPage } from '@/features/supervisor/ReportReviewPage'
import { ReportsPage } from '@/features/supervisor/ReportsPage'
import { SupervisorDashboard } from '@/features/supervisor/SupervisorDashboard'
import { VaultPage } from '@/features/supervisor/VaultPage'
import { StaffLayout } from '@/layouts/StaffLayout'

// The router follows Vite's base (vite.config.ts): '/api' in production, '/' in development.
const ROUTER_BASENAME = import.meta.env.BASE_URL.replace(/\/+$/, '') || '/'

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={ROUTER_BASENAME}>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<LoginPage />} />

            <Route element={<RequireRole roles={['teller']} />}>
              <Route element={<TellerLayout />}>
                <Route path="/teller" element={<TellerHomePage />} />
                <Route path="/teller/counter" element={<CounterPage />} />
                <Route path="/teller/transactions" element={<TransactionsPage />} />
                <Route path="/teller/close" element={<CloseShiftPage />} />
                <Route path="/teller/history" element={<ShiftHistoryPage />} />
                <Route path="/teller/history/:id" element={<ShiftDetailPage />} />
              </Route>
            </Route>

            <Route element={<RequireRole roles={['supervisor']} />}>
              <Route element={<StaffLayout />}>
                <Route path="/supervisor" element={<SupervisorDashboard />} />
                <Route path="/supervisor/reports" element={<ReportsPage />} />
                <Route path="/supervisor/reports/:id" element={<ReportReviewPage />} />
                <Route path="/supervisor/vault" element={<VaultPage />} />
              </Route>
            </Route>

            <Route element={<RequireRole roles={['admin', 'supervisor']} />}>
              <Route element={<StaffLayout />}>
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/customers/:id" element={<CustomerDetailPage />} />
                <Route path="/staff" element={<StaffPage />} />
                <Route path="/staff/:id" element={<StaffDetailPage />} />
                <Route path="/audit/transactions" element={<AuditLogPage />} />
                <Route path="/audit/transactions/:id" element={<AuditTransactionPage />} />
                <Route path="/audit/journals" element={<JournalPage />} />
                <Route path="/reports" element={<ExportsPage />} />
              </Route>
            </Route>

            <Route element={<RequireRole roles={['admin']} />}>
              <Route element={<StaffLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/settings" element={<SettingsPage />} />
                <Route path="/admin/graduation" element={<GraduationPage />} />
                <Route path="/customers/new" element={<CustomerFormPage />} />
                <Route path="/customers/import" element={<CustomerImportPage />} />
                <Route path="/customers/:id/edit" element={<CustomerFormPage />} />
                <Route path="/customers/:id/card" element={<CustomerCardPage />} />
                <Route path="/staff/new" element={<StaffFormPage />} />
                <Route path="/staff/import" element={<StaffImportPage />} />
                <Route path="/staff/:id/edit" element={<StaffFormPage />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
