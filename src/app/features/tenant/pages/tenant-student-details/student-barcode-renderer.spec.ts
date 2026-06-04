import { renderStudentBarcodeSvg } from './student-barcode-renderer';

describe('renderStudentBarcodeSvg', () => {
  it('renders Code 128 SVG for a valid 12-digit barcode value', () => {
    const result = renderStudentBarcodeSvg('000000000123');

    expect(result).not.toBeNull();
    expect(result?.value).toBe('000000000123');
    expect(result?.svg).toContain('<svg');
    expect(result?.svg).toContain('data-student-barcode-value="000000000123"');
    expect(result?.svg).toContain('Student barcode 000000000123');
  });

  it('does not render a barcode for missing values', () => {
    expect(renderStudentBarcodeSvg('')).toBeNull();
    expect(renderStudentBarcodeSvg(null)).toBeNull();
    expect(renderStudentBarcodeSvg(undefined)).toBeNull();
  });

  it('does not render a barcode for invalid values', () => {
    expect(renderStudentBarcodeSvg('123')).toBeNull();
    expect(renderStudentBarcodeSvg('00000000012A')).toBeNull();
    expect(renderStudentBarcodeSvg('0000000001234')).toBeNull();
  });
});
