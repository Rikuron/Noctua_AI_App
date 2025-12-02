import mammoth from 'mammoth'
import { extractTextFromPDF } from './pdfExtractor'

/**
 * Extracts text content from various file types.
 * Supports PDF, DOCX, TXT, and MD files.
 * 
 * @param file - The file object to extract text from
 * @returns Promise resolving to the extracted text string
 * @throws Error if the file type is unsupported or extraction fails
 */
export async function extractTextFromFile (file: File): Promise<string> {
  const fileType = file.name.split('.').pop()?.toLowerCase()

  try {
    switch (fileType) {
      case 'pdf':
        return await extractTextFromPDF(file) // If PDF, call extractTextFromPDF hook

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