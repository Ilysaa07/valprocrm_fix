/**
 * Utility functions for invoice management
 */

/**
 * Validates invoice number format
 * Expected format: INV-YYYYMMDD-XXXX where XXXX is a 4-digit sequence number
 */
export function validateInvoiceNumberFormat(invoiceNumber: string): boolean {
  const pattern = /^INV-\d{8}-\d{4}$/;
  return pattern.test(invoiceNumber);
}

/**
 * Extracts date and sequence from invoice number
 */
export function parseInvoiceNumber(invoiceNumber: string): { date: string; sequence: number } | null {
  const match = invoiceNumber.match(/^INV-(\d{8})-(\d{4})$/);
  if (!match) return null;
  
  return {
    date: match[1],
    sequence: parseInt(match[2], 10)
  };
}

/**
 * Formats invoice number for display
 */
export function formatInvoiceNumber(invoiceNumber: string): string {
  const parsed = parseInvoiceNumber(invoiceNumber);
  if (!parsed) return invoiceNumber;
  
  const year = parsed.date.substring(0, 4);
  const month = parsed.date.substring(4, 6);
  const day = parsed.date.substring(6, 8);
  
  return `INV-${year}/${month}/${day}-${parsed.sequence.toString().padStart(4, '0')}`;
}

/**
 * Compares two invoice numbers for sorting (descending order)
 */
export function compareInvoiceNumbers(a: string, b: string): number {
  const parsedA = parseInvoiceNumber(a);
  const parsedB = parseInvoiceNumber(b);
  
  if (!parsedA || !parsedB) {
    return b.localeCompare(a); // Fallback to string comparison
  }
  
  // First compare by date
  const dateComparison = parsedB.date.localeCompare(parsedA.date);
  if (dateComparison !== 0) {
    return dateComparison;
  }
  
  // Then by sequence number (descending)
  return parsedB.sequence - parsedA.sequence;
}

/**
 * Gets the next sequence number for a given date
 */
export function getNextSequenceForDate(invoiceNumbers: string[], targetDate: string): number {
  const datePrefix = `INV-${targetDate}`;
  
  let maxSequence = 0;
  for (const invoiceNumber of invoiceNumbers) {
    if (invoiceNumber.startsWith(datePrefix)) {
      const parsed = parseInvoiceNumber(invoiceNumber);
      if (parsed && parsed.sequence > maxSequence) {
        maxSequence = parsed.sequence;
      }
    }
  }
  
  return maxSequence + 1;
}

/**
 * Sanitizes company name for filename
 */
export function sanitizeCompanyName(companyName: string): string {
  return companyName
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase()
    .slice(0, 50); // Limit length for filename compatibility
}

/**
 * Formats date for filename (YYYYMMDD)
 */
export function formatDateForFilename(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}
