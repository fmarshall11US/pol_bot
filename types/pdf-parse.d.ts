declare module 'pdf-parse' {
  interface PDFInfo {
    PDFFormatVersion: string;
    IsAcroFormPresent: boolean;
    IsXFAPresent: boolean;
    [key: string]: any;
  }

  interface PDFMetadata {
    _metadata?: {
      [key: string]: string;
    };
    [key: string]: any;
  }

  interface PDFData {
    numpages: number;
    numrender: number;
    info: PDFInfo;
    metadata: PDFMetadata;
    text: string;
    version: string;
  }

  interface PDFOptions {
    max?: number;
    version?: string;
    pagerender?: (pageData: any) => string;
  }

  function pdf(dataBuffer: Buffer | ArrayBuffer | Uint8Array, options?: PDFOptions): Promise<PDFData>;
  
  export default pdf;
}