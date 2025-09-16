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
    body?.classList.remove('pdf-mode');
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
    body?.classList.remove('pdf-mode');
  }
};

// Utility function to format filename with timestamp
export const generateFilename = (prefix: string = 'invoice'): string => {
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-');
  return `${prefix}_${timestamp}.pdf`;
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
