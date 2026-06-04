import JsBarcode from 'jsbarcode';

export interface StudentBarcodeRenderResult {
  readonly svg: string;
  readonly value: string;
}

const STUDENT_BARCODE_PATTERN = /^\d{12}$/;

export function renderStudentBarcodeSvg(barcodeNumber: string | null | undefined): StudentBarcodeRenderResult | null {
  const value = barcodeNumber?.trim() ?? '';
  if (!STUDENT_BARCODE_PATTERN.test(value)) {
    return null;
  }

  const svgNode = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

  try {
    JsBarcode(svgNode, value, {
      format: 'CODE128',
      displayValue: false,
      margin: 10,
      height: 64,
      width: 2,
      background: '#ffffff',
      lineColor: '#000000',
    });
  } catch {
    return null;
  }

  svgNode.setAttribute('role', 'img');
  svgNode.setAttribute('aria-label', `Student barcode ${value}`);
  svgNode.setAttribute('data-student-barcode-value', value);
  svgNode.setAttribute('preserveAspectRatio', 'xMidYMid meet');

  return {
    svg: svgNode.outerHTML,
    value,
  };
}
