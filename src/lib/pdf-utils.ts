// Dynamic import to avoid SSR issues
let html2pdf: any = null;

if (typeof window !== 'undefined') {
  import('html2pdf.js').then((module) => {
    html2pdf = module.default;
  });
}

export interface PDFOptions {
  filename?: string;
  margin?: number | number[];
  image?: { type: string; quality: number };
  html2canvas?: { scale: number; useCORS: boolean; letterRendering: boolean };
  jsPDF?: { unit: string; format: string; orientation: string };
}

export const defaultPDFOptions: PDFOptions = {
  filename: 'invoice.pdf',
  margin: 0, // true 1:1 - no outer margins (we use inner padding in CSS)
  image: { type: 'jpeg', quality: 0.95 },
  html2canvas: { 
    // Keep scale at 1 for 100% rendering; quality handled by JPEG quality above
    scale: 1,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    onclone: (doc: Document) => {
      // Ensure backgrounds are preserved
      const invoice = doc.getElementById('invoice-content');
      if (invoice) {
        (invoice as HTMLElement).style.backgroundColor = '#ffffff';
      }
    }
    ,letterRendering: true,
    allowTaint: true
  },
  jsPDF: { 
    unit: 'mm', 
    format: 'a4', 
    orientation: 'portrait' 
  }
};

export const downloadPDF = async (
  elementId: string, 
  options: PDFOptions = {}
): Promise<void> => {
  const body = typeof document !== 'undefined' ? document.body : null;
  try {
    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      throw new Error('PDF generation is only available in the browser');
    }

    // Ensure html2pdf is loaded
    if (!html2pdf) {
      const module = await import('html2pdf.js');
      html2pdf = module.default;
    }

    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`);
    }

    const mergedOptions = { 
      ...defaultPDFOptions, 
      ...options, 
    pagebreak: { mode: ['avoid-all'] },
      html2canvas: {
        ...defaultPDFOptions.html2canvas,
        ...options.html2canvas,
      scale: 1
      },
      jsPDF: { ...(defaultPDFOptions.jsPDF as any), ...(options.jsPDF || {}), format: 'a4' }
    } as PDFOptions;
    
    // Enter PDF rendering mode (hide watermark/background artifacts)
    body?.classList.add('pdf-mode');

    // Create the PDF
    // If content taller than A4, temporarily scale down to fit
    const rect = element.getBoundingClientRect();
    const targetHeightPx = Math.round((297 / 25.4) * 96); // 297mm @ ~96dpi
    const targetWidthPx = Math.round((210 / 25.4) * 96);  // 210mm @ ~96dpi
    let scaleFactor = 1;
    const heightScale = targetHeightPx / rect.height;
    const widthScale = targetWidthPx / rect.width;
    if (rect.height > targetHeightPx || rect.width > targetWidthPx) {
      scaleFactor = Math.max(0.6, Math.min(heightScale, widthScale));
      const el = element as HTMLElement;
      el.style.transformOrigin = 'top left';
      el.style.transform = `scale(${scaleFactor})`;
      el.style.height = `${rect.height * scaleFactor}px`;
      el.style.width = `${rect.width * scaleFactor}px`;
      el.style.overflow = 'hidden';
    }

    const pdf = await html2pdf()
      .set(mergedOptions)
      .from(element)
      .save();

    return pdf;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  } finally {
    // Exit PDF rendering mode
    if (body) {
      body.classList.remove('pdf-mode');
    }
    const el = typeof document !== 'undefined' ? document.getElementById('invoice-content') as HTMLElement | null : null;
    if (el) {
      el.style.transform = '';
      el.style.height = '';
      el.style.overflow = '';
    }
  }
};

export const printPDF = async (
  elementId: string, 
  options: PDFOptions = {}
): Promise<void> => {
  const body = typeof document !== 'undefined' ? document.body : null;
  try {
    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      throw new Error('PDF printing is only available in the browser');
    }

    // Ensure html2pdf is loaded
    if (!html2pdf) {
      const module = await import('html2pdf.js');
      html2pdf = module.default;
    }

    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`);
    }

    const mergedOptions = { 
      ...defaultPDFOptions, 
      ...options,
      pagebreak: { mode: ['avoid-all'] },
      html2canvas: {
        ...defaultPDFOptions.html2canvas,
        ...options.html2canvas,
        scale: 1
      },
      jsPDF: { ...(defaultPDFOptions.jsPDF as any), ...(options.jsPDF || {}), format: 'a4' }
    } as PDFOptions;
    
    // Enter PDF rendering mode to normalize backgrounds
    body?.classList.add('pdf-mode');

    // Generate PDF and open in new window for printing
    // Scale-to-fit for print as well
    const rect = element.getBoundingClientRect();
    const targetHeightPx = Math.round((297 / 25.4) * 96);
    const targetWidthPx = Math.round((210 / 25.4) * 96);
    let scaleFactor = 1;
    const heightScale = targetHeightPx / rect.height;
    const widthScale = targetWidthPx / rect.width;
    if (rect.height > targetHeightPx || rect.width > targetWidthPx) {
      scaleFactor = Math.max(0.6, Math.min(heightScale, widthScale));
      const el = element as HTMLElement;
      el.style.transformOrigin = 'top left';
      el.style.transform = `scale(${scaleFactor})`;
      el.style.height = `${rect.height * scaleFactor}px`;
      el.style.width = `${rect.width * scaleFactor}px`;
      el.style.overflow = 'hidden';
    }

    const pdf = await html2pdf()
      .set(mergedOptions)
      .from(element)
      .outputPdf('blob');

    const blob = new Blob([pdf], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    // Open in new window for printing
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
    
    // Clean up the URL after a delay
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  } catch (error) {
    console.error('Error printing PDF:', error);
    throw new Error('Failed to print PDF. Please try again.');
  } finally {
    // Exit PDF rendering mode
    if (body) {
      body.classList.remove('pdf-mode');
    }
    const el = typeof document !== 'undefined' ? document.getElementById('invoice-content') as HTMLElement | null : null;
    if (el) {
      el.style.transform = '';
      el.style.height = '';
      el.style.overflow = '';
    }
  }
};

// Utility function to format filename with timestamp
const sanitizeFilename = (name: string): string => {
  return name
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 120);
};

export const generateFilename = (prefix: string = 'invoice', clientName?: string, invoiceNumber?: string, companyName?: string, creationDate?: string | Date): string => {
  // Format: INVOICE_[ClientName]_[CreationDate]_[InvoiceNumber].pdf
  // Use clientName (PT client) instead of companyName for the filename
  const sanitizedClientName = clientName ? sanitizeFilename(clientName) : 'CLIENT';
  const sanitizedInvoiceNumber = invoiceNumber ? sanitizeFilename(invoiceNumber) : 'INV-001';
  
  // Format creation date as YYYYMMDD
  let formattedDate: string;
  if (creationDate) {
    const date = typeof creationDate === 'string' ? new Date(creationDate) : creationDate;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    formattedDate = `${year}${month}${day}`;
  } else {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    formattedDate = `${year}${month}${day}`;
  }
  
  return `INVOICE_${sanitizedClientName}_${formattedDate}_${sanitizedInvoiceNumber}.pdf`;
};

// Utility function to validate element before PDF generation
export const validateElementForPDF = (elementId: string): boolean => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id "${elementId}" not found`);
    return false;
  }
  
  if (element.offsetHeight === 0 || element.offsetWidth === 0) {
    console.error(`Element with id "${elementId}" has no dimensions`);
    return false;
  }
  
  return true;
};
