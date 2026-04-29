/**
 * Compresse une image via Canvas API.
 * @param {File|Blob} file  Fichier image source
 * @param {number} maxSizeMB  Taille max en Mo (défaut 1)
 * @param {number} maxPx      Dimension max (largeur ou hauteur, défaut 800)
 * @returns {Promise<Blob>}   Blob JPEG compressé
 */
export function compressImage(file, maxSizeMB = 1, maxPx = 800) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width > maxPx || height > maxPx) {
        if (width > height) {
          height = Math.round((height * maxPx) / width);
          width  = maxPx;
        } else {
          width  = Math.round((width * maxPx) / height);
          height = maxPx;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);

      canvas.toBlob(blob => {
        if (!blob) { reject(new Error('Canvas toBlob failed')); return; }
        if (blob.size <= maxSizeMB * 1024 * 1024) {
          resolve(blob);
        } else {
          // Deuxième passage à qualité réduite
          canvas.toBlob(blob2 => resolve(blob2 || blob), 'image/jpeg', 0.6);
        }
      }, 'image/jpeg', 0.85);
    };

    img.onerror = reject;
    img.src = url;
  });
}
