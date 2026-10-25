/**
 * Currency Utility: Integer Paise <-> Indian Rupee (INR)
 * Prevents floating point math bugs in financial and e-commerce records.
 */

export const paiseToINR = (paise: number): string => {
  if (isNaN(paise)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100);
};

export const inrToPaise = (rupees: number): number => {
  return Math.round(rupees * 100);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-IN').format(num);
};

export const formatDate = (isoString: string): string => {
  if (!isoString) return '-';
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};
