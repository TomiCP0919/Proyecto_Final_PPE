import React from 'react';
import AuthGuard from '../auth/AuthGuard';
import AdminShell from '../layout/AdminShell';
import ProductTable from '../products/ProductTable';

export default function ProductsPage() {
  return (
    <AuthGuard>
      <AdminShell currentPath="/dashboard/products">
        <ProductTable />
      </AdminShell>
    </AuthGuard>
  );
}
