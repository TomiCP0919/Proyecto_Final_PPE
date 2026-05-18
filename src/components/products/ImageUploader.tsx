import { useRef } from 'react';
import type { ImagePreview } from '../../hooks/useImageUpload';

interface ImageUploaderProps {
  productId?: string;
  existingImages?: Array<{ id: string; storage_path: string; alt_text: string | null; is_primary: boolean }>;
  previews: ImagePreview[];
  onAddFiles: (files: FileList | File[]) => void;
  onRemovePreview: (id: string) => void;
}

export default function ImageUploader({ existingImages = [], previews, onAddFiles, onRemovePreview }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      onAddFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div>
      <label className="input-label">Imágenes del producto</label>

      {/* Drop zone */}
      <div
        className="rounded-xl p-6 text-center cursor-pointer transition-all duration-200"
        style={{
          border: '2px dashed rgba(148, 163, 184, 0.2)',
          background: 'rgba(15, 23, 42, 0.4)',
        }}
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(59, 130, 246, 0.4)';
          (e.currentTarget as HTMLElement).style.background = 'rgba(59, 130, 246, 0.05)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(148, 163, 184, 0.2)';
          (e.currentTarget as HTMLElement).style.background = 'rgba(15, 23, 42, 0.4)';
        }}
      >
        <svg className="w-8 h-8 mx-auto mb-2" style={{ color: '#475569' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="text-sm font-medium" style={{ color: '#94a3b8' }}>
          Arrastra imágenes aquí o{' '}
          <span style={{ color: '#60a5fa' }}>haz clic para seleccionar</span>
        </p>
        <p className="text-xs mt-1" style={{ color: '#475569' }}>
          PNG, JPG o WebP • Máximo 5MB por imagen
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && onAddFiles(e.target.files)}
        id="image-upload-input"
      />

      {/* Preview grid */}
      {(existingImages.length > 0 || previews.length > 0) && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-4">
          {/* Existing images from DB */}
          {existingImages.map((img) => (
            <div
              key={img.id}
              className="relative group aspect-square rounded-xl overflow-hidden"
              style={{ border: '1px solid rgba(148, 163, 184, 0.1)' }}
            >
              <img
                src={`${import.meta.env.PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${img.storage_path}`}
                alt={img.alt_text || ''}
                className="w-full h-full object-cover"
              />
              {img.is_primary && (
                <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: 'rgba(59, 130, 246, 0.9)', color: 'white' }}>
                  Principal
                </div>
              )}
            </div>
          ))}

          {/* New previews */}
          {previews.map((preview) => (
            <div
              key={preview.id}
              className="relative group aspect-square rounded-xl overflow-hidden"
              style={{ border: '1px solid rgba(148, 163, 184, 0.1)' }}
            >
              <img
                src={preview.previewUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />

              {/* Upload status overlay */}
              {preview.uploading && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
                  <svg className="animate-spin w-6 h-6 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              )}

              {preview.error && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(239, 68, 68, 0.3)' }}>
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" />
                  </svg>
                </div>
              )}

              {/* Remove button */}
              <button
                onClick={() => onRemovePreview(preview.id)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'rgba(239, 68, 68, 0.9)' }}
              >
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
