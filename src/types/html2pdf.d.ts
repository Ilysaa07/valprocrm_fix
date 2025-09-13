declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin: number | [number, number, number, number]
    filename: string
    image: {
      type: string
      quality: number
    }
    html2canvas: {
      scale: number
      useCORS: boolean
      backgroundColor: string | null
      logging: boolean
      windowWidth?: number
    }
    jsPDF: {
      unit: string
      format: string | [number, number]
      orientation: string
      compress: boolean
    }
    pagebreak: {
      mode: string[]
    }
  }

  function html2pdf(): {
    set(options: Html2PdfOptions): {
      from(element: HTMLElement): {
        save(): Promise<void>
      }
    }
  }

  export default html2pdf
}
