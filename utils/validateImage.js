'use client';

const acceptedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
const maxSizeBytes = 10 * 1024 * 1024; // 10MB
const maxMegapixels = 25;

export function validateImageFile(file) {
  return new Promise((resolve) => {
    if (!acceptedTypes.includes(file.type)) {
      return resolve({ valid: false, error: "File type not allowed. Only GIF, JPEG, JPG, PNG files." });
    }

    if (file.size > maxSizeBytes) {
      return resolve({ valid: false, error: "File size exceeds 10MB limit." });
    }

    const reader = new FileReader();
    const img = new Image();

    reader.onload = (e) => {
      img.onload = () => {
        const width = img.width;
        const height = img.height;
        const megapixels = (width * height) / 1_000_000;

        if (megapixels > maxMegapixels) {
          resolve({ valid: false, error: `Image is ${megapixels.toFixed(2)}MP. Limit is ${maxMegapixels}MP.` });
        } else {
          resolve({ valid: true, megapixels });
        }
      };

      img.onerror = () => resolve({ valid: false, error: "Could not load image for dimension check." });
      img.src = e.target.result;
    };

    reader.onerror = () => resolve({ valid: false, error: "Could not read image file." });
    reader.readAsDataURL(file);
  });
}
