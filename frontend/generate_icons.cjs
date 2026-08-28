const sharp = require('sharp');
const fs = require('fs');

const svg = fs.readFileSync('public/favicon.svg');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function run() {
  for (const size of sizes) {
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(`public/icons/icon-${size}.png`);
    console.log(`OK - icon-${size}.png`);
  }

  for (const size of [192, 512]) {
    const padding = Math.round(size * 0.15);
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 10, g: 15, b: 20, alpha: 1 }
      }
    })
      .composite([{
        input: await sharp(svg).resize(size - padding * 2, size - padding * 2).toBuffer(),
        top: padding,
        left: padding
      }])
      .png()
      .toFile(`public/icons/icon-${size}-maskable.png`);
    console.log(`OK - icon-${size}-maskable.png`);
  }

  await sharp(svg)
    .resize(180, 180)
    .png()
    .toFile('public/apple-touch-icon.png');
  console.log('OK - apple-touch-icon.png');
}

run().catch(err => {
  console.error('FAILED:', err.message);
  process.exit(1);
});
