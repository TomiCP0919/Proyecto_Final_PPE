/* ───────────────────────────────────────────────
   TechHub — Type Definitions
   These mirror the Supabase DB schema.
   The DB team will set up the actual tables;
   these types define the contract for the admin UI.
   ─────────────────────────────────────────────── */

export type AdminRole = 'admin' | 'editor';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: AdminRole;
  approval_status: ApprovalStatus;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
}

export type ProductStatus = 'draft' | 'active' | 'archived';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  price: number;
  compare_at_price: number | null;
  stock: number;
  sku: string | null;
  category_id: string | null;
  brand_id: string | null;
  status: ProductStatus;
  specifications: Record<string, string | number | boolean> | null;
  weight_kg: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  storage_path: string;
  alt_text: string | null;
  display_order: number;
  is_primary: boolean;
  created_at: string;
}

/* Joined product with relations */
export interface ProductWithRelations extends Product {
  category: Category | null;
  brand: Brand | null;
  images: ProductImage[];
}

/* Form types for create/edit */
export interface ProductFormData {
  name: string;
  description: string;
  short_description: string;
  price: number;
  compare_at_price: number | null;
  stock: number;
  sku: string;
  category_id: string;
  brand_id: string;
  status: ProductStatus;
  specifications: Record<string, string | number | boolean>;
  weight_kg: number | null;
}

export interface CategoryFormData {
  name: string;
  description: string;
}

/* Supabase Database type (simplified for client) */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
        Relationships: [];
      };
      categories: {
        Row: Category;
        Insert: Omit<Category, 'id' | 'created_at'>;
        Update: Partial<Omit<Category, 'id' | 'created_at'>>;
        Relationships: [];
      };
      brands: {
        Row: Brand;
        Insert: Omit<Brand, 'id' | 'created_at'>;
        Update: Partial<Omit<Brand, 'id' | 'created_at'>>;
        Relationships: [];
      };
      products: {
        Row: Product;
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'slug'>;
        Update: Partial<Omit<Product, 'id' | 'created_at'>>;
        Relationships: [];
      };
      product_images: {
        Row: ProductImage;
        Insert: Omit<ProductImage, 'id' | 'created_at'>;
        Update: Partial<Omit<ProductImage, 'id' | 'created_at'>>;
        Relationships: [];
      };
    };
  };
}
