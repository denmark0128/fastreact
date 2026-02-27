import { createBrowserRouter, redirect } from 'react-router-dom'

import { tokenStorageKey } from '../api/axios'
import MainLayout from '../layouts/MainLayout'
import ProtectedRoute from '../routes/ProtectedRoute'
import LoginPage from '../modules/auth/LoginPage'
import DashboardPage from '../modules/dashboard/DashboardPage'
import EmployeesPage from '../modules/employees/EmployeesPage'
import EmployeeDetailPage from '../modules/employees/EmployeeDetailPage'
import LeavePage from '../modules/leave/LeavePage'
import PayrollPage from '../modules/payroll/PayrollPage'
import RecruitmentPage from '../modules/recruitment/RecruitmentPage'
import PerformancePage from '../modules/performance/PerformancePage'
import SettingsPage from '../modules/settings/SettingsPage'
import AdminSettingsPage from '../modules/settings/AdminSettingsPage'
import AuditTrailPage from '../modules/settings/AuditTrailPage'
import ProfilePage from '../modules/profile/ProfilePage'
import DepartmentsPage from '../modules/departments/DepartmentsPage'
import DepartmentDetailPage from '../modules/departments/DepartmentDetailPage'

function protectedLoader() {
  const token = localStorage.getItem(tokenStorageKey)
  if (!token) {
    throw redirect('/login')
  }
  return null
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    loader: protectedLoader,
    children: [
      {
        path: '/',
        element: <MainLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'employees', element: <EmployeesPage /> },
          { path: 'employees/:employeeId', element: <EmployeeDetailPage /> },
          { path: 'departments', element: <DepartmentsPage /> },
          { path: 'departments/:departmentId', element: <DepartmentDetailPage /> },
          { path: 'leave', element: <LeavePage /> },
          { path: 'payroll', element: <PayrollPage /> },
          { path: 'recruitment', element: <RecruitmentPage /> },
          { path: 'performance', element: <PerformancePage /> },
          { path: 'settings', element: <SettingsPage /> },
          { path: 'settings/admin', element: <AdminSettingsPage /> },
          { path: 'settings/audit-trail', element: <AuditTrailPage /> },
        ],
      },
    ],
  },
])
