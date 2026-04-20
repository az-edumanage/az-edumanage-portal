import fs from 'fs';
import path from 'path';

const srcDir = path.join(process.cwd(), 'src/app');

function run() {
  function processDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
         processDir(fullPath);
      } else if (file.endsWith('.component.ts')) {
         const compName = file.replace('.component.ts', '');
         // If a directory with the exact same name exists in this same folder,
         // it means we already moved it, but somehow a leftover file exists here.
         const expectedDir = path.join(dir, compName);
         if (fs.existsSync(expectedDir) && fs.statSync(expectedDir).isDirectory() && path.basename(dir) !== compName) {
            console.log('Deleting duplicate parent file:', fullPath);
            fs.unlinkSync(fullPath);
            continue;
         }

         // Let's ensure it is split
         splitFiles(fullPath, dir, compName);
      }
    }
  }

  function splitFiles(filePath, dir, compName) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let hasChanged = false;
    
    // Convert template to templateUrl
    const templateMatch = content.match(/template:\s*`([\s\S]*?)`\s*(,?)/);
    if (templateMatch) {
      fs.writeFileSync(path.join(dir, `${compName}.component.html`), templateMatch[1].trim());
      content = content.replace(templateMatch[0], `templateUrl: './${compName}.component.html'${templateMatch[2]}`);
      hasChanged = true;
    } else if (!content.includes('templateUrl:')) {
      const regexQuote = /template:\s*['"](.*?)['"]\s*(,?)/;
      const quoteMatch = content.match(regexQuote);
      if (quoteMatch) {
         fs.writeFileSync(path.join(dir, `${compName}.component.html`), quoteMatch[1] || '');
         content = content.replace(quoteMatch[0], `templateUrl: './${compName}.component.html'${quoteMatch[2]}`);
         hasChanged = true;
      }
    }
    
    // Convert styles to styleUrl
    const stylesMatch = content.match(/styles:\s*\[\s*`([\s\S]*?)`\s*\]\s*(,?)/);
    if (stylesMatch) {
      fs.writeFileSync(path.join(dir, `${compName}.component.css`), stylesMatch[1].trim());
      content = content.replace(stylesMatch[0], `styleUrl: './${compName}.component.css'${stylesMatch[2]}`);
      hasChanged = true;
    }
    
    if (hasChanged) {
      console.log('Saving separated files for:', filePath);
      fs.writeFileSync(filePath, content);
    }
  }

  processDir(path.join(srcDir, 'features'));
  processDir(path.join(srcDir, 'layout'));
}

run();
