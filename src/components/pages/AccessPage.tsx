import React from 'react';
import AuthGuard from '../auth/AuthGuard';
import AdminShell from '../layout/AdminShell';
import AccessManager from '../access/AccessManager';

export default function AccessPage() {
  return (
    <AuthGuard>
      <AdminShell currentPath="/dashboard/access">
        <AccessManager />
      </AdminShell>
    </AuthGuard>
  );
}
