import { marked } from 'marked'
import removeMarkdown from 'remove-markdown'

// Configure marked for safe parsing
marked.setOptions({
  gfm: true,
  breaks: true,
})

// Download as TXT (converted from markdown using remove-markdown)
export const downloadAsTxt = (content: string, filename: string) => {
  const plainText = removeMarkdown(content, {
    stripListLeaders: true,
    listUnicodeChar: '•',
    gfm: true,
    useImgAltText: true,
  })
  
  const blob = new Blob([plainText], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Download as MD
export const downloadAsMd = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Simpler approach: Convert markdown to plain text and format for PDF
export const downloadAsPDF = async (
  content: string, 
  filename: string,
  sourceNames?: string[],
  generatedAt?: Date,
  notebookName?: string
) => {
  try {
    const { jsPDF } = await import('jspdf')
    
    // Convert markdown to plain text
    const plainText = removeMarkdown(content, {
      stripListLeaders: false,
      listUnicodeChar: '',
      gfm: true,
      useImgAltText: true,
    })
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    })
    
    // Set margins
    const margin = 20
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const contentWidth = pageWidth - (margin * 2)
    
    // Add header
    pdf.setFontSize(18)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(30, 64, 175)
    pdf.text(notebookName || 'Summary', margin, 25)
    
    // Add metadata
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(107, 114, 128)
    
    let yPos = 35
    if (generatedAt) {
      pdf.text(`Generated: ${new Date(generatedAt).toLocaleString()}`, margin, yPos)
      yPos += 6
    }
    if (sourceNames && sourceNames.length > 0) {
      pdf.text(`Sources: ${sourceNames.join(', ')}`, margin, yPos)
      yPos += 6
    }
    
    // Add separator
    yPos += 4
    pdf.setDrawColor(59, 130, 246)
    pdf.setLineWidth(0.5)
    pdf.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 10
    
    // Add content with automatic line wrapping
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(0, 0, 0)
    
    const lines = pdf.splitTextToSize(plainText, contentWidth)
    
    for (let i = 0; i < lines.length; i++) {
      if (yPos > pageHeight - margin) {
        pdf.addPage()
        yPos = margin
      }
      
      pdf.text(lines[i], margin, yPos)
      yPos += 7
    }
    
    // Add footer
    pdf.setFontSize(10)
    pdf.setTextColor(128, 128, 128)
    pdf.text(`Generated with AI Assistant • ${new Date().toLocaleDateString()}`, 
      margin, pageHeight - 10)
    
    // Save PDF
    pdf.save(`${filename}.pdf`)
    
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw new Error('Failed to generate PDF. Please try again.')
  }
}

// Export all
export const downloadUtils = {
  txt: downloadAsTxt,
  md: downloadAsMd,
  pdf: downloadAsPDF,
}