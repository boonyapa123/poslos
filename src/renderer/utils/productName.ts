/**
 * Get product name based on current language
 */
export function getProductName(
  product: { name: string; nameEn?: string; nameLo?: string },
  language: string
): string {
  switch (language) {
    case 'en':
      return product.nameEn || product.name;
    case 'lo':
      return product.nameLo || product.name;
    case 'th':
    default:
      return product.name;
  }
}

/**
 * Get unit name based on current language
 */
export function getUnitName(
  unit: { unitName: string; unitNameEn?: string; unitNameLo?: string },
  language: string
): string {
  switch (language) {
    case 'en':
      return unit.unitNameEn || unit.unitName;
    case 'lo':
      return unit.unitNameLo || unit.unitName;
    case 'th':
    default:
      return unit.unitName;
  }
}
