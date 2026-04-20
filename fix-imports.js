const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.cwd(), 'src/app');

function fixImports(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixImports(fullPath);
    } else if (fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // We want to replace paths like '.././owner-integrations-list.component'
      // with '../owner-integrations-list/owner-integrations-list.component'
      let updatedContent = content.replace(/(from\s+['"])(\.\.\/\.\/)(.*?)(['"])/g, (match, prefix, pathPrefix, compPath, suffix) => {
        // compPath is typically 'owner-integrations-list.component'
        if (compPath.endsWith('.component')) {
            const compName = compPath.replace('.component', '');
            return `${prefix}../${compName}/${compPath}${suffix}`;
        }
        return match;
      });
      
      if (content !== updatedContent) {
        console.log(`Updated imports in ${fullPath}`);
        fs.writeFileSync(fullPath, updatedContent, 'utf8');
      }
    }
  }
}

fixImports(srcDir);
