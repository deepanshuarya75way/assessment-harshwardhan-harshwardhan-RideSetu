import fs from 'fs';
import path from 'path';

function searchDirectory(dir: string, terms: string[]) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (file === 'node_modules' || file === '.next' || file === '.git' || file === 'dist') continue;

    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchDirectory(fullPath, terms);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.json')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const term of terms) {
        if (content.toLowerCase().includes(term.toLowerCase())) {
          console.log(`[MATCH] Found "${term}" in: ${fullPath}`);
        }
      }
    }
  }
}

console.log('--- AUDITING REPOSITORY FOR LEGACY MAP TERMS ---');
searchDirectory(path.resolve(process.cwd(), 'src'), [
  'RideSetu GeoEngine',
  'GeoEngine',
  'tile.openstreetmap.org',
  'react-leaflet',
  'simulated map',
  'fake GPS',
]);
console.log('--- AUDIT COMPLETE ---');
