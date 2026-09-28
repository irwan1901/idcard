/**
 * Utilities for reading and resizing uploaded profile photos
 */

export function readFileAsDataUrl(file: File, maxDimension: number = 800, quality: number = 0.9): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File yang diunggah harus berupa gambar (JPG, PNG, WebP).'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) {
        reject(new Error('File gambar kosong.'));
        return;
      }

      // Create an Image object to resize appropriately
      const img = new Image();
      img.onerror = () => resolve(result); // Fallback to raw dataURL if image load fails
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // If image is already smaller than maxDimension, return directly
        if (width <= maxDimension && height <= maxDimension) {
          resolve(result);
          return;
        }

        // Calculate aspect ratio
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
          resolve(result);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG or PNG based on original type
        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const resizedDataUrl = canvas.toDataURL(mimeType, quality);
        resolve(resizedDataUrl);
      };

      img.src = result;
    };

    reader.readAsDataURL(file);
  });
}
