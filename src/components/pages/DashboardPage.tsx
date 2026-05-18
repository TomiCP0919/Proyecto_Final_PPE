import React from 'react';
import AuthGuard from '../auth/AuthGuard';
import AdminShell from '../layout/AdminShell';
import DashboardHome from '../dashboard/DashboardHome';

export default function DashboardPage() {
  return (
    <AuthGuard>
      <AdminShell currentPath="/dashboard">
        <DashboardHome />
      </AdminShell>
    </AuthGuard>
  );
}
