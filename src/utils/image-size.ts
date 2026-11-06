// The size a photo is shrunk to before upload: the proportion is kept and the longest side is capped
export const fitSize = (width: number, height: number, maxSize = 1280) => {
  const scale = Math.min(1, maxSize / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
};
