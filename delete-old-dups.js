const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.cwd(), 'src/app');

function cleanup(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      cleanup(fullPath);
    } else if (file.endsWith('.component.ts')) {
      const compName = file.replace('.component.ts', '');
      const potentialDir = path.join(dir, compName);
      if (path.basename(dir) !== compName && fs.existsSync(potentialDir) && fs.statSync(potentialDir).isDirectory()) {
         try {
           console.log('Deleting:', fullPath);
           fs.unlinkSync(fullPath);
         } catch(e) {
           console.error(e);
         }
      }
    }
  }
}

cleanup(path.join(srcDir, 'features'));
cleanup(path.join(srcDir, 'layout'));
