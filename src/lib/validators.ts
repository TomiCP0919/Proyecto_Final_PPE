import { z } from 'zod';

export const productSchema = z.object({
  name: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(200, 'El nombre no puede exceder 200 caracteres'),
  description: z.string().optional().default(''),
  short_description: z
    .string()
    .max(300, 'La descripción corta no puede exceder 300 caracteres')
    .optional()
    .default(''),
  price: z
    .number({ invalid_type_error: 'El precio debe ser un número' })
    .min(0, 'El precio no puede ser negativo'),
  compare_at_price: z
    .number()
    .min(0, 'El precio de comparación no puede ser negativo')
    .nullable()
    .optional(),
  stock: z
    .number({ invalid_type_error: 'El stock debe ser un número entero' })
    .int('El stock debe ser un número entero')
    .min(0, 'El stock no puede ser negativo'),
  sku: z
    .string()
    .max(50, 'El SKU no puede exceder 50 caracteres')
    .optional()
    .default(''),
  category_id: z.string().uuid('Debe seleccionar una categoría').or(z.literal('')),
  brand_id: z.string().uuid('Debe seleccionar una marca').or(z.literal('')),
  status: z.enum(['draft', 'active', 'archived'], {
    errorMap: () => ({ message: 'Estado inválido' }),
  }),
  specifications: z.record(z.union([z.string(), z.number(), z.boolean()])).optional().default({}),
  weight_kg: z.number().min(0).nullable().optional(),
});

export const categorySchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  description: z
    .string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional()
    .default(''),
});

export const brandSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  logo_url: z
    .string()
    .url('Ingrese una URL de logo válida')
    .or(z.literal(''))
    .optional()
    .nullable(),
});

export const loginSchema = z.object({
  email: z.string().email('Ingrese un email válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export type ProductFormValues = z.infer<typeof productSchema>;
export type CategoryFormValues = z.infer<typeof categorySchema>;
export type BrandFormValues = z.infer<typeof brandSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
