import * as fs from 'fs';
import * as path from 'path';

function refactor() {
  const srcDir = path.join('/', 'src/app');
  
  function processDir(dir: string) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        processDir(fullPath);
      } else if (file.endsWith('.component.ts')) {
        refactorComponent(fullPath);
      }
    }
  }

  function refactorComponent(filePath: string) {
    const dir = path.dirname(filePath);
    const filename = path.basename(filePath);
    const compName = filename.replace('.component.ts', '');
    
    // Check if the component is already inside its own folder
    if (path.basename(dir) === compName) {
       splitFiles(filePath, dir, compName);
       return;
    }
    
    const newDir = path.join(dir, compName);
    if (!fs.existsSync(newDir)) fs.mkdirSync(newDir, { recursive: true });
    
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Fix relative imports: anything starting with '.' needs to go one up, meaning prepending '../'
    content = content.replace(/(from\s+['"])(\.[^'"]+['"])/g, (match, p1, p2) => {
      return `${p1}../${p2}`;
    });
    
    // Write new content
    fs.writeFileSync(filePath, content);
    const newFilePath = path.join(newDir, filename);
    fs.renameSync(filePath, newFilePath);
    
    splitFiles(newFilePath, newDir, compName);
  }

  function splitFiles(filePath: string, dir: string, compName: string) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let hasChanged = false;
    
    // Extract template
    const templateMatch = content.match(/template:\s*`([\s\S]*?)`\s*(,?)/);
    if (templateMatch) {
      fs.writeFileSync(path.join(dir, `${compName}.component.html`), templateMatch[1]);
      content = content.replace(templateMatch[0], `templateUrl: './${compName}.component.html'${templateMatch[2]}`);
      hasChanged = true;
    } else if (!content.includes('templateUrl:')) {
      fs.writeFileSync(path.join(dir, `${compName}.component.html`), '');
      const regexQuote = /template:\s*['"](.*?)['"]\s*(,?)/;
      const quoteMatch = content.match(regexQuote);
      if (quoteMatch) {
         fs.writeFileSync(path.join(dir, `${compName}.component.html`), quoteMatch[1] || '');
         content = content.replace(quoteMatch[0], `templateUrl: './${compName}.component.html'${quoteMatch[2]}`);
         hasChanged = true;
      }
    }
    
    // Extract styles
    const stylesMatch = content.match(/styles:\s*\[\s*`([\s\S]*?)`\s*\]\s*(,?)/);
    if (stylesMatch) {
      fs.writeFileSync(path.join(dir, `${compName}.component.css`), stylesMatch[1]);
      content = content.replace(stylesMatch[0], `styleUrl: './${compName}.component.css'${stylesMatch[2]}`);
      hasChanged = true;
    } else if (!content.includes('styleUrl:') && !content.includes('styleUrls:')) {
      fs.writeFileSync(path.join(dir, `${compName}.component.css`), '');
    }
    
    if (hasChanged) {
      fs.writeFileSync(filePath, content);
    }
  }

  // Process features
  processDir(path.join(srcDir, 'features'));

  // Fix routes in app.routes.ts
  function fixRoutes(filePath: string) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf-8');
    
    content = content.replace(/(import\s+({[^}]+}|\w+)\s+from\s+['"])([^'"]+)(\.component)(['"];)/g, (match, prefix, compName, pathWithoutExt, ext, suffix) => {
      // check if it's already structured
      const parts = pathWithoutExt.split('/');
      const filename = parts[parts.length - 1];
      if (parts[parts.length - 2] === filename) {
        return match;
      }
      return `${prefix}${pathWithoutExt}/${filename}${ext}${suffix}`;
    });
    
    fs.writeFileSync(filePath, content);
  }

  fixRoutes(path.join(srcDir, 'app.routes.ts'));
  console.log('Refactoring completed successfully!');
}

refactor();
