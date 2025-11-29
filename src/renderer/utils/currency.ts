import i18n from '../../i18n/config';

/**
 * Get currency symbol based on current language
 */
export function getCurrencySymbol(): string {
  return i18n.t('currency.symbol');
}

/**
 * Get currency code (THB, USD, LAK)
 */
export function getCurrencyCode(): string {
  return i18n.t('currency.code');
}

/**
 * Get currency name
 */
export function getCurrencyName(): string {
  return i18n.t('currency.name');
}

/**
 * Get exchange rate (relative to THB)
 */
export function getExchangeRate(): number {
  const rate = i18n.t('currency.rate');
  return typeof rate === 'string' ? parseFloat(rate) : rate;
}

/**
 * Convert amount from THB to current currency
 */
export function convertFromTHB(amountTHB: number): number {
  const rate = getExchangeRate();
  return amountTHB * rate;
}

/**
 * Convert amount from current currency to THB
 */
export function convertToTHB(amount: number): number {
  const rate = getExchangeRate();
  return amount / rate;
}

/**
 * Format currency with symbol and proper decimal places
 */
export function formatCurrency(amount: number, options?: {
  convertFromTHB?: boolean;
  showSymbol?: boolean;
  decimals?: number;
}): string {
  const {
    convertFromTHB: shouldConvert = false,
    showSymbol = true,
    decimals = 2
  } = options || {};

  // Convert if needed
  const displayAmount = shouldConvert ? convertFromTHB(amount) : amount;
  
  // Format number - no decimals at all
  const formatted = Math.round(displayAmount).toLocaleString(i18n.language, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  // Add symbol
  if (showSymbol) {
    const symbol = getCurrencySymbol();
    const code = getCurrencyCode();
    
    // Different format for different currencies
    if (code === 'THB') {
      return `฿${formatted}`;
    } else if (code === 'USD') {
      return `$${formatted}`;
    } else if (code === 'LAK') {
      return `${formatted}₭`;
    }
    return `${symbol}${formatted}`;
  }

  return formatted;
}

/**
 * Format currency for display (with conversion)
 */
export function displayCurrency(amountTHB: number): string {
  return formatCurrency(amountTHB, { convertFromTHB: true });
}

/**
 * Get currency info
 */
export function getCurrencyInfo() {
  return {
    symbol: getCurrencySymbol(),
    code: getCurrencyCode(),
    name: getCurrencyName(),
    rate: getExchangeRate()
  };
}

/**
 * Format number without currency symbol (for prices, subtotals, etc.)
 */
export function formatNumber(amount: number, options?: {
  convertFromTHB?: boolean;
}): string {
  const {
    convertFromTHB: shouldConvert = false,
  } = options || {};

  // Convert if needed
  const displayAmount = shouldConvert ? convertFromTHB(amount) : amount;
  
  // Format number - no decimals, no symbol
  return Math.round(displayAmount).toLocaleString(i18n.language);
}
