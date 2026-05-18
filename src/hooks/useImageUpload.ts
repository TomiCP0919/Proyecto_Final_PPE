import { useState, useCallback } from 'react';
import { uploadProductImage, deleteProductImage, getImageUrl } from '../lib/storage';

interface ImagePreview {
  id: string;
  file: File;
  previewUrl: string;
  uploading: boolean;
  uploaded: boolean;
  storagePath?: string;
  error?: string;
}

interface UseImageUploadReturn {
  previews: ImagePreview[];
  addFiles: (files: FileList | File[]) => void;
  removePreview: (id: string) => void;
  uploadAll: (productId: string) => Promise<string[]>;
  reset: () => void;
  hasFiles: boolean;
}

export function useImageUpload(): UseImageUploadReturn {
  const [previews, setPreviews] = useState<ImagePreview[]>([]);

  const addFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newPreviews: ImagePreview[] = fileArray.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      uploading: false,
      uploaded: false,
    }));

    setPreviews((prev) => [...prev, ...newPreviews]);
  }, []);

  const removePreview = useCallback((id: string) => {
    setPreviews((prev) => {
      const removed = prev.find((p) => p.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.previewUrl);
        /* If already uploaded, delete from storage */
        if (removed.storagePath) {
          deleteProductImage(removed.storagePath).catch(console.error);
        }
      }
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const uploadAll = useCallback(
    async (productId: string): Promise<string[]> => {
      const storagePaths: string[] = [];

      for (let i = 0; i < previews.length; i++) {
        const preview = previews[i];
        if (preview.uploaded && preview.storagePath) {
          storagePaths.push(preview.storagePath);
          continue;
        }

        setPreviews((prev) =>
          prev.map((p) =>
            p.id === preview.id ? { ...p, uploading: true } : p
          )
        );

        try {
          const path = await uploadProductImage(productId, preview.file);
          storagePaths.push(path);

          setPreviews((prev) =>
            prev.map((p) =>
              p.id === preview.id
                ? { ...p, uploading: false, uploaded: true, storagePath: path }
                : p
            )
          );
        } catch (err: any) {
          setPreviews((prev) =>
            prev.map((p) =>
              p.id === preview.id
                ? { ...p, uploading: false, error: err.message }
                : p
            )
          );
        }
      }

      return storagePaths;
    },
    [previews]
  );

  const reset = useCallback(() => {
    previews.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setPreviews([]);
  }, [previews]);

  return {
    previews,
    addFiles,
    removePreview,
    uploadAll,
    reset,
    hasFiles: previews.length > 0,
  };
}
