import sharp from 'sharp';
import fs from 'fs';

async function generateIcons() {
  const inputImage = 'public/icon_Med.png';
  
  if (!fs.existsSync(inputImage)) {
    console.error(`Input file ${inputImage} does not exist`);
    return;
  }

  // Generate 512x512 maskable icon (padding the image with #1b3b31 background)
  await sharp(inputImage)
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 27, g: 59, b: 49, alpha: 1 } // #1b3b31
    })
    .toFile('public/pwa-512x512.png');

  // Generate 192x192 icon
  await sharp(inputImage)
    .resize(192, 192, {
      fit: 'contain',
      background: { r: 27, g: 59, b: 49, alpha: 1 } // #1b3b31
    })
    .toFile('public/pwa-192x192.png');

  console.log('Icons generated successfully.');
}

generateIcons().catch(console.error);
