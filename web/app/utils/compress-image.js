/**
 * On-device photo compression. Uploads travel as data URLs inside JSON, and
 * both the 6 MB express limit and Vercel's ~4.5 MB request cap make raw phone
 * photos (often 3–8 MB) a non-starter — so we shrink them before sending.
 * Target: ≤1600 px on the long edge, JPEG quality stepped down until the
 * file fits `maxBytes` (dimensions halved as a last resort). The house
 * budget is a soft 50 KB per photo.
 */

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode the image.'));
    img.src = src;
  });
}

/**
 * @param {File} file  an image file from an <input type="file">
 * @param {{maxDim?: number, maxBytes?: number}} [opts]
 * @returns {Promise<string>} JPEG data URL
 */
export async function compressImage(file, { maxDim = 1600, maxBytes = 50000 } = {}) {
  const src = await readAsDataURL(file);
  let img = await loadImage(src);

  let scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
  let width = Math.max(1, Math.round(img.naturalWidth * scale));
  let height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const render = (w, h, quality) => {
    canvas.width = w;
    canvas.height = h;
    // flatten transparency — JPEG has no alpha and would render it black
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', quality);
  };

  let out = render(width, height, 0.82);
  let quality = 0.82;
  // base64 is ~4/3 the binary size; step quality down first…
  while (out.length * 0.75 > maxBytes && quality > 0.35) {
    quality = Math.round((quality - 0.12) * 100) / 100;
    out = render(width, height, quality);
  }
  // …then halve the dimensions until it fits (max 3 passes)
  let passes = 0;
  while (out.length * 0.75 > maxBytes && passes < 3) {
    width = Math.max(1, Math.floor(width / 2));
    height = Math.max(1, Math.floor(height / 2));
    out = render(width, height, quality);
    passes++;
  }
  if (out.length * 0.75 > maxBytes) {
    throw new Error('That photo is too large even after resizing.');
  }
  return out;
}

/** True when the file is a compressible still image. */
export function isImageFile(file) {
  return /^image\//.test(file.type || '');
}
