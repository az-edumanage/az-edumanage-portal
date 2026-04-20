const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src/app/features/owner/owner-billing/owner-billing.component.html');
let content = fs.readFileSync(filePath, 'utf8');

// Replace Table Shells
content = content.replace(/<table class="w-full text-left text-sm">/g, '<table appTable>');
content = content.replace(/<thead class="bg-slate-50 dark:bg-slate-800\/50 text-slate-500 dark:text-slate-500 border-b border-slate-200 dark:border-slate-800">/g, '<thead appTableHeader>');
content = content.replace(/<tbody class="divide-y divide-slate-200 dark:divide-slate-800">/g, '<tbody appTableBody>');

// Replace TR
content = content.replace(/<tr class="hover:bg-slate-50 dark:hover:bg-slate-800\/50 transition-colors">/g, '<tr appTableRow>');

// Replace TH
content = content.replace(/<th class="px-6 py-4 font-medium">/g, '<th appTableHead>');
content = content.replace(/<th class="px-6 py-4 font-medium text-right">/g, '<th appTableHead class="text-right">');

// Replace TD basics
// Make sure to replace <td class="px-6 py-4"> and <td class="px-6 py-4 anything">
content = content.replace(/<td class="px-6 py-4">/g, '<td appTableCell>');
content = content.replace(/<td class="px-6 py-4 /g, '<td appTableCell class="');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Tables refactored in HTML.');
