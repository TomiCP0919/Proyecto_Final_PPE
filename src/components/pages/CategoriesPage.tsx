import React from 'react';
import AuthGuard from '../auth/AuthGuard';
import AdminShell from '../layout/AdminShell';
import CategoryManager from '../categories/CategoryManager';

export default function CategoriesPage() {
  return (
    <AuthGuard>
      <AdminShell currentPath="/dashboard/categories">
        <CategoryManager />
      </AdminShell>
    </AuthGuard>
  );
}
