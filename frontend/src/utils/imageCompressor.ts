/**
 * Client-side lightweight image compression for Proofing Web Gallery.
 * Resizes large camera files (20-40MB) to web-friendly previews (1200px, ~120KB)
 * directly in the browser within milliseconds.
 */

export interface CompressedImageResult {
  filename: string;
  dataUrl: string;
  sizeKb: number;
}

export const compressImageForWebPreview = (
  file: File,
  maxDimension = 1280,
  quality = 0.78
): Promise<CompressedImageResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Resize proportionally
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Draw image onto canvas
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG with controlled quality
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const approxSizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);

        resolve({
          filename: file.name,
          dataUrl,
          sizeKb: approxSizeKb,
        });
      };

      img.onerror = () => reject(new Error(`Failed to load image: ${file.name}`));
      img.src = event.target?.result as string;
    };

    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
    reader.readAsDataURL(file);
  });
};

/**
 * Batch compress multiple files with progress callback
 */
export const batchCompressImages = async (
  files: File[],
  onProgress?: (completed: number, total: number) => void
): Promise<CompressedImageResult[]> => {
  const results: CompressedImageResult[] = [];
  const total = files.length;

  for (let i = 0; i < total; i++) {
    const file = files[i];
    // Chỉ xử lý file ảnh
    if (!file.type.startsWith('image/')) continue;

    try {
      const res = await compressImageForWebPreview(file);
      results.push(res);
    } catch (err) {
      console.warn('Skipping file due to compression error:', file.name, err);
    }

    if (onProgress) {
      onProgress(i + 1, total);
    }
  }

  return results;
};
