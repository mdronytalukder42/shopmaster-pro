
declare var html2pdf: any;

/**
 * Professional PDF Generation Service
 * Replaces window.print() with a real PDF download.
 */
export const pdfService = {
  /**
   * Generates a PDF from a DOM element or CSS selector.
   * @param element CSS selector (e.g., '.printable-area') or HTMLElement
   * @param fileName Name of the downloaded file
   */
  async generatePDF(element: string | HTMLElement, fileName: string) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    
    if (!el) {
      console.error("PDF Error: Element not found", element);
      return;
    }

    const options = {
      margin: [15, 10, 20, 10], // Top, Left, Bottom, Right (mm)
      filename: `${fileName}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true,
        logging: false 
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
      // Small delay to ensure any dynamic images/fonts are ready
      await new Promise(resolve => setTimeout(resolve, 300));
      await html2pdf().from(el).set(options).save();
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("পিডিএফ ডাউনলোড করতে সমস্যা হচ্ছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    }
  }
};
