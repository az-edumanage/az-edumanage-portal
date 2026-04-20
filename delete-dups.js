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
        console.log('Deleting duplicate file:', fullPath);
        fs.unlinkSync(fullPath);
      }
    }
  }
}

cleanup(path.join(srcDir, 'features'));
cleanup(path.join(srcDir, 'layout'));
