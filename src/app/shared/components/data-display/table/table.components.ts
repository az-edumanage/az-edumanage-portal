import { Directive } from '@angular/core';

@Directive({ 
  selector: 'table[appTable]', 
  standalone: true, 
  host: { 'class': 'ds-table' } 
})
export class TableDirective {}

@Directive({ 
  selector: 'thead[appTableHeader]', 
  standalone: true, 
  host: { 'class': 'ds-table-header' } 
})
export class TableHeaderDirective {}

@Directive({ 
  selector: 'tbody[appTableBody]', 
  standalone: true, 
  host: { 'class': 'ds-table-body' } 
})
export class TableBodyDirective {}

@Directive({ 
  selector: 'tr[appTableRow]', 
  standalone: true, 
  host: { 'class': 'ds-table-row' } 
})
export class TableRowDirective {}

@Directive({ 
  selector: 'th[appTableHead]', 
  standalone: true, 
  host: { 'class': 'ds-table-head' } 
})
export class TableHeadDirective {}

@Directive({ 
  selector: 'td[appTableCell]', 
  standalone: true, 
  host: { 'class': 'ds-table-cell' } 
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
