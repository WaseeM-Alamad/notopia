"use client";

const acceptedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const MIN_DIMENSION = 400; // must be at least 400x400

export function validateAvatarImageFile(file) {
  return new Promise((resolve) => {
    if (!acceptedTypes.includes(file.type)) {
      return resolve({
        valid: false,
        error: "Only GIF, JPEG, JPG, and PNG images are allowed.",
      });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return resolve({
        valid: false,
        error: "Avatar image must be smaller than 5MB.",
      });
    }

    const reader = new FileReader();
    const img = new Image();

    reader.onload = (e) => {
      img.onload = () => {
        const { width, height } = img;
        const megapixels = (width * height) / 1_000_000;

        if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
          return resolve({
            valid: false,
            error: `Avatar must be at least ${MIN_DIMENSION}×${MIN_DIMENSION}px.`,
          });
        }

        resolve({
          valid: true,
          width,
          height,
          megapixels,
        });
      };

      img.onerror = () =>
        resolve({ valid: false, error: "Failed to load image." });

      img.src = e.target.result;
    };

    reader.onerror = () =>
      resolve({ valid: false, error: "Failed to read image file." });

    reader.readAsDataURL(file);
  });
}
