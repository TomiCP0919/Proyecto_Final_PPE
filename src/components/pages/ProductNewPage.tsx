import React from 'react';
import AuthGuard from '../auth/AuthGuard';
import AdminShell from '../layout/AdminShell';
import ProductForm from '../products/ProductForm';

export default function ProductNewPage() {
  return (
    <AuthGuard>
      <AdminShell currentPath="/dashboard/products">
        <ProductForm />
      </AdminShell>
    </AuthGuard>
  );
}
