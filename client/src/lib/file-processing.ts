import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Use inline worker to avoid external CDN issues
pdfjsLib.GlobalWorkerOptions.workerSrc = '';

export interface ProcessedFile {
  content: string;
  filename: string;
  fileType: 'pdf' | 'docx';
  pageCount?: number;
  wordCount: number;
}

export async function processFile(file: File): Promise<ProcessedFile> {
  const filename = file.name;
  const extension = filename.toLowerCase().split('.').pop();

  if (!extension || !['pdf', 'docx'].includes(extension)) {
    throw new Error('Unsupported file type. Please upload a PDF or DOCX file.');
  }

  let content: string;
  let pageCount: number | undefined;

  try {
    if (extension === 'pdf') {
      // Try PDF processing but recommend DOCX as more reliable
      try {
        const result = await processPDF(file);
        content = result.content;
        pageCount = result.pageCount;
      } catch (pdfError) {
        console.error('PDF processing failed:', pdfError);
        throw new Error('PDF processing is currently experiencing issues. For best results, please convert your PDF to DOCX format and upload that instead. DOCX files provide more reliable text extraction.');
      }
    } else {
      content = await processDOCX(file);
    }

    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;

    if (wordCount === 0) {
      throw new Error(`No readable text found in the ${extension.toUpperCase()} file. Please ensure the document contains extractable text content.`);
    }

    return {
      content,
      filename,
      fileType: extension as 'pdf' | 'docx',
      pageCount,
      wordCount,
    };
  } catch (error) {
    console.error('File processing error:', error);
    throw error; // Re-throw the original error with specific message
  }
}

async function processPDF(file: File): Promise<{ content: string; pageCount: number }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Configure PDF loading with minimal options to avoid worker issues
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useSystemFonts: false,
      disableFontFace: true,
      useWorkerFetch: false,
      verbosity: 0, // Reduce console output
    });
    
    const pdf = await loadingTask.promise;
    const pageCount = pdf.numPages;
    
    const textContent: string[] = [];

    for (let i = 1; i <= pageCount; i++) {
      try {
        const page = await pdf.getPage(i);
        const textContentObj = await page.getTextContent();
        const pageText = textContentObj.items
          .filter((item): item is any => 'str' in item)
          .map(item => item.str)
          .join(' ');
        textContent.push(pageText);
      } catch (pageError) {
        console.warn(`Failed to process page ${i}:`, pageError);
        textContent.push(`[Page ${i} content could not be extracted]`);
      }
    }

    if (textContent.join('').trim().length === 0) {
      throw new Error('No readable text found in PDF. The file may contain only images or scanned content.');
    }

    return {
      content: textContent.join('\n\n'),
      pageCount,
    };
  } catch (error) {
    console.error('PDF processing failed:', error);
    
    // For now, suggest using DOCX as an alternative
    if (error instanceof Error && error.message.includes('worker')) {
      throw new Error('PDF processing is currently having technical issues. Please try converting your PDF to DOCX format and uploading that instead.');
    }
    
    throw new Error('PDF processing failed. The file might be corrupted, password-protected, or contain only images. Please try converting to DOCX format.');
  }
}

async function processDOCX(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  
  if (result.messages.length > 0) {
    console.warn('DOCX processing warnings:', result.messages);
  }

  return result.value;
}

export function validateFileSize(file: File, maxSizeMB: number = 10): void {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  if (file.size > maxSizeBytes) {
    throw new Error(`File size exceeds ${maxSizeMB}MB limit. Please upload a smaller file.`);
  }
}

export function validateFileType(file: File): void {
  const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const allowedExtensions = ['pdf', 'docx'];
  
  const extension = file.name.toLowerCase().split('.').pop();
  
  if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(extension || '')) {
    throw new Error('Invalid file type. Please upload a PDF or DOCX file.');
  }
}
