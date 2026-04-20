import { Directive } from '@angular/core';

@Directive({ 
  selector: 'table[appTable]', 
  standalone: true, 
  host: { 'class': 'w-full text-left text-sm' } 
})
export class TableDirective {}

@Directive({ 
  selector: 'thead[appTableHeader]', 
  standalone: true, 
  host: { 'class': 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-500 border-b border-slate-200 dark:border-slate-800' } 
})
export class TableHeaderDirective {}

@Directive({ 
  selector: 'tbody[appTableBody]', 
  standalone: true, 
  host: { 'class': 'divide-y divide-slate-200 dark:divide-slate-800' } 
})
export class TableBodyDirective {}

@Directive({ 
  selector: 'tr[appTableRow]', 
  standalone: true, 
  host: { 'class': 'hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors' } 
})
export class TableRowDirective {}

@Directive({ 
  selector: 'th[appTableHead]', 
  standalone: true, 
  host: { 'class': 'px-6 py-4 font-medium' } 
})
export class TableHeadDirective {}

@Directive({ 
  selector: 'td[appTableCell]', 
  standalone: true, 
  host: { 'class': 'px-6 py-4' } 
})
export class TableCellDirective {}

export const TABLE_COMPONENTS = [
  TableDirective,
  TableHeaderDirective,
  TableBodyDirective,
  TableRowDirective,
  TableHeadDirective,
  TableCellDirective
];
