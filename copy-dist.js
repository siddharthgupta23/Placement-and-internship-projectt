import fs from 'fs';
import path from 'path';

try {
  if (fs.existsSync('frontend/dist')) {
    fs.cpSync('frontend/dist', 'dist', { recursive: true });
    console.log('Successfully synchronized frontend/dist -> dist');
  }
} catch (err) {
  console.error('Error copying dist:', err);
}
