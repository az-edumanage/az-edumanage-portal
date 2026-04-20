import { AbstractControl, ValidationErrors } from '@angular/forms';

export function requiredTrimmed(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (typeof value !== 'string') {
    return null;
  }

  return value.trim().length > 0 ? null : { requiredTrimmed: true };
}
