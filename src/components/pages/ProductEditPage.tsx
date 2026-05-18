import React, { useState, useEffect } from 'react';
import AuthGuard from '../auth/AuthGuard';
import AdminShell from '../layout/AdminShell';
import ProductForm from '../products/ProductForm';

export default function ProductEditPage() {
  const [productId, setProductId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      setProductId(id);
    }
  }, []);

  return (
    <AuthGuard>
      <AdminShell currentPath="/dashboard/products">
        {productId ? <ProductForm productId={productId} /> : null}
      </AdminShell>
    </AuthGuard>
  );
}
