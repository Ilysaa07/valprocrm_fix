export type ExportMode = 'flexible' | 'a4'

export async function exportElementToPDF(element: HTMLElement, filename: string, options?: { mode?: ExportMode }) {
  const html2pdf = (await import('html2pdf.js')).default
  const mode: ExportMode = options?.mode || 'flexible'

  const rect = element.getBoundingClientRect()
  const contentWidth = Math.max(element.scrollWidth, element.offsetWidth, rect.width)
  const contentHeight = Math.max(element.scrollHeight, element.offsetHeight, rect.height)

  const originalMinHeight = element.style.minHeight
  const originalBoxSizing = element.style.boxSizing

  const marginTop = 12
  const marginRight = 12
  const marginBottom = 12
  const marginLeft = 12

  const mmToPx = (mm: number) => Math.round((mm / 25.4) * 96)
  const pxToMm = (px: number) => (px / 96) * 25.4

  const opt = {
    margin: [marginTop, marginLeft, marginBottom, marginRight],
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2, 
      useCORS: true, 
      backgroundColor: null, 
      logging: false, 
      windowWidth: element.scrollWidth || undefined 
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4' as string | [number, number], 
      orientation: 'portrait' as const, 
      compress: true 
    },
    pagebreak: { mode: ['css', 'avoid-all'] as const },
  }

  let scaled = false
  let previousTransform = ''
  let previousTransformOrigin = ''
  let previousWidth = ''
  let previousHeight = ''

  if (mode === 'flexible') {
    const pageWidthMm = pxToMm(contentWidth) + (marginLeft + marginRight)
    const pageHeightMm = pxToMm(contentHeight) + (marginTop + marginBottom)
    const minWidthMm = 210 // A4 width
    const finalWidthMm = Math.max(pageWidthMm, minWidthMm)
    opt.jsPDF.format = [finalWidthMm, pageHeightMm]
  } else { // mode === 'a4'
    const targetInnerWidthMm = 210 - (marginLeft + marginRight)
    const targetInnerHeightMm = 297 - (marginTop + marginBottom)
    const targetInnerWidthPx = mmToPx(targetInnerWidthMm)
    const targetInnerHeightPx = mmToPx(targetInnerHeightMm)
    const scale = Math.min(targetInnerWidthPx / contentWidth, targetInnerHeightPx / contentHeight, 1)

    previousTransform = element.style.transform
    previousTransformOrigin = element.style.transformOrigin
    previousWidth = element.style.width
    previousHeight = element.style.height
    
    element.style.transformOrigin = 'top left'
    element.style.transform = `scale(${scale})`
    element.style.width = `${contentWidth}px`
    element.style.height = `${Math.ceil(contentHeight * scale)}px`
    scaled = true
    opt.jsPDF.format = 'a4'
  }

  // Add print-specific class for exact colors
  document.documentElement.classList.add('print-colors-exact')
  
  await html2pdf().set(opt).from(element).save()
  
  document.documentElement.classList.remove('print-colors-exact')

  // Restore original styles
  if (scaled) {
    element.style.transform = previousTransform
    element.style.transformOrigin = previousTransformOrigin
    element.style.width = previousWidth
    element.style.height = previousHeight
  }
  
  element.style.minHeight = originalMinHeight
  element.style.boxSizing = originalBoxSizing
}
