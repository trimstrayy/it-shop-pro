export const generateProductCode = (type: 'hardware' | 'software', category: string): string => {
  const prefix = type === 'hardware' ? 'HW' : 'SW';
  const catCode = category.substring(0, 3).toUpperCase();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${catCode}-${random}`;
};

export const generateBarcode = (): string => {
  return '890' + Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
};

export const generateQuotationNumber = (): string => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `QT-${year}-${random}`;
};

export const generateInvoiceNumber = (): string => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `INV-${year}-${random}`;
};
