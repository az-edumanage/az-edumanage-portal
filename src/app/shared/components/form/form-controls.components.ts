import { Directive } from '@angular/core';

@Directive({
  selector: 'input[appInput]',
  standalone: true,
  host: {
    class: 'ds-input',
  },
})
export class InputDirective {}

@Directive({
  selector: 'select[appSelect]',
  standalone: true,
  host: {
    class: 'ds-select',
  },
})
export class SelectDirective {}

export const FORM_COMPONENTS = [InputDirective, SelectDirective] as const;
