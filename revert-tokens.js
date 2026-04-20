const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.cwd(), 'src', 'app');

const reverseMappings = {
  'bg-card': 'bg-white',
  'bg-background': 'bg-slate-50',
  'bg-muted': 'bg-slate-100',
  'bg-accent': 'bg-slate-200',
  
  'border-border': 'border-slate-200',
  'divide-border': 'divide-slate-200',
  
  'text-foreground': 'text-slate-900',
  'text-muted-foreground': 'text-slate-500',
  
  'text-primary': 'text-indigo-600',
  'bg-primary': 'bg-indigo-600',
  'bg-primary\\/10': 'bg-indigo-50',
  
  'hover:bg-muted': 'hover:bg-slate-50',
  'hover:text-primary': 'hover:text-indigo-600',
  'hover:opacity-90': 'hover:bg-indigo-700',
  
  'focus:ring-ring': 'focus:ring-indigo-500',
  'focus:border-ring': 'focus:border-indigo-500'
};

function revertTokensInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // We explicitly replace back the exact tokens we added
  for (const [key, value] of Object.entries(reverseMappings)) {
    const isSpecialRegex = key.includes('\\/');
    // Adjust boundaries for special characters 
    const regexStr = isSpecialRegex ? key : `\\b${key}\\b`;
    const regex = new RegExp(regexStr, 'g');
    content = content.replace(regex, value);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.html') || file.endsWith('.ts')) {
      revertTokensInFile(fullPath);
    }
  }
}

processDirectory(srcDir);
console.log("Tokens reverted.");
