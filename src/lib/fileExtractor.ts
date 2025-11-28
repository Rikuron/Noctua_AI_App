import mammoth from 'mammoth'
import { extractTextFromPDF } from './pdfExtractor'

// Function to extract text from other file types (.DOCX, .TXT, .MD)
export async function extractTextFromFile (file: File): Promise<string> {
  const fileType = file.name.split('.').pop()?.toLowerCase()

  try {
    switch (fileType) {
      case 'pdf':
        return await extractTextFromPDF(file)

      case 'docx':
        const arrayBuffer = await file.arrayBuffer()
        const result = await mammoth.extractRawText({ arrayBuffer })
        return result.value

      case 'txt':
      case 'md':
        return await file.text()

      default:
        throw new Error(`Unsupported file type: ${fileType}`)
    }
  } catch (error) {
    console.error(`Error extracting text from ${file.name}:`, error)
    throw new Error(`Failed to extract text from ${file.name}`)
  }
}