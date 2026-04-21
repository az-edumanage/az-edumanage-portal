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

@Directive({
  selector: 'input[type="checkbox"][appCheckbox]',
  standalone: true,
  host: {
    class: 'ds-checkbox',
  },
})
export class CheckboxDirective {}

@Directive({
  selector: 'input[type="radio"][appRadio]',
  standalone: true,
  host: {
    class: 'ds-radio',
  },
})
export class RadioDirective {}

@Directive({
  selector: 'input[type="checkbox"][appToggleInput]',
  standalone: true,
  host: {
    class: 'ds-toggle-input',
  },
})
export class ToggleInputDirective {}

@Directive({
  selector: 'div[appToggleTrack]',
  standalone: true,
  host: {
    class: 'ds-toggle-track',
  },
})
export class ToggleTrackDirective {}

export const FORM_COMPONENTS = [
  InputDirective,
  SelectDirective,
  CheckboxDirective,
  RadioDirective,
  ToggleInputDirective,
  ToggleTrackDirective,
] as const;
