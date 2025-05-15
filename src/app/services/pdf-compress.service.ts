import { Injectable } from '@angular/core';
import { PDFDocument, PDFImage } from 'pdf-lib';
import { createCanvas, loadImage } from 'canvas';

const { ipcRenderer } = (window as any).require("electron");

interface SaveOptions {
  useObjectStreams?: boolean;
  useSmallerObjectStreams?: boolean;
  addDefaultPage?: boolean;
  objectsPerTick?: number;
  onProgress?: (progress: {
    loaded: number;
    total: number;
  }) => void;
}

interface CompressOptions {
  quality: number;
  maxWidth: number;
}

interface PDFImageExtended extends PDFImage {
  setImage: (image: PDFImage) => void;
}


@Injectable({
  providedIn: 'root'
})
export class PdfCompressService {
  private ipcRenderer: typeof ipcRenderer;

  constructor() {
    if (window.require) {
      this.ipcRenderer = window.require('electron').ipcRenderer;
    }
  }

  // public async compressPDF(inputBytes: Uint8Array, options = {
  //   imageQuality: 0.7,
  //   maxImageWidth: 1200
  // }): Promise<Uint8Array> {
  //   const pdfDoc = await PDFDocument.load(inputBytes);
  //   const pages = pdfDoc.getPages();

  //   // 1. Primero optimizamos las imágenes
  //   for (const page of pages) {
  //     const images = await this.getImagesFromPage(page);
  //     for (const imgData of images) {
  //       await this.compressPDFImage(
  //         pdfDoc,
  //         imgData.image,
  //         options.imageQuality,
  //         options.maxImageWidth
  //       );
  //     }
  //   }

  //   // 2. Luego guardamos con las opciones soportadas
  //   return await pdfDoc.save({
  //     useObjectStreams: true,  // Reduce tamaño usando flujos de objetos
  //     // Otras opciones válidas:
  //     // useSmallerObjectStreams: true,
  //     // addDefaultPage: false,
  //     // objectsPerTick: 100
  //   });
  // }

  // private async getImagesFromPage(page: any): Promise<{image: PDFImage, ref: any}[]> {
  //   const images: {image: PDFImage, ref: any}[] = [];
  //   const resources = page.node.Resources();

  //   if (!resources) return images;

  //   const xObject = resources.get('XObject');
  //   if (!xObject) return images;

  //   const xObjectKeys = xObject.keys();
  //   for (const key of xObjectKeys) {
  //     const value = xObject.get(key);
  //     if (this.isPDFImage(value)) {
  //       images.push({
  //         image: value,
  //         ref: xObject.get(key),
  //       });
  //     }
  //   }

  //   return images;
  // }

  // private isPDFImage(obj: any): obj is PDFImage {
  //   return obj && typeof obj.embed === 'function' && typeof obj.size === 'function';
  // }

  // private async compressPDFImage(
  //   pdfDoc: PDFDocument,
  //   image: PDFImage,
  //   quality: number,
  //   maxWidth: number
  // ): Promise<void> {
  //   try {
  //     // 1. Obtener datos de la imagen con manejo seguro de tipos
  //     let imageBytes: Uint8Array;
  //     try {
  //       const embedded: any = await image.embed();
  //       // Verificación explícita del tipo de retorno
  //       if (!(embedded instanceof Uint8Array)) {
  //         console.warn('El método embed no devolvió un Uint8Array válido');
  //         return;
  //       }
  //       imageBytes = embedded;
  //     } catch (error) {
  //       console.warn('Error al extraer imagen:', error);
  //       return;
  //     }

  //     // 2. Verificar que tenemos datos de imagen válidos
  //     if (!imageBytes || imageBytes.length === 0) {
  //       console.warn('No se obtuvieron datos de imagen válidos');
  //       return;
  //     }

  //     // 3. Determinar el tipo de imagen
  //     const imageType = this.getImageType(imageBytes);
  //     if (!imageType) {
  //       console.warn('Tipo de imagen no soportado');
  //       return;
  //     }

  //     // 4. Procesar imagen con canvas
  //     const img = await loadImage(imageBytes);

  //     // 5. Calcular nuevas dimensiones manteniendo aspect ratio
  //     const imageDims = image.size();
  //     let newWidth = imageDims.width;
  //     let newHeight = imageDims.height;

  //     if (imageDims.width > maxWidth) {
  //       const ratio = maxWidth / imageDims.width;
  //       newWidth = maxWidth;
  //       newHeight = imageDims.height * ratio;
  //     }

  //     // 6. Crear canvas y comprimir
  //     const canvas = createCanvas(newWidth, newHeight);
  //     const ctx = canvas.getContext('2d');
  //     if (!ctx) {
  //       throw new Error('No se pudo obtener contexto 2D del canvas');
  //     }

  //     ctx.drawImage(img, 0, 0, newWidth, newHeight);

  //     // 7. Convertir a buffer comprimido
  //     const compressedBytes = canvas.toBuffer('image/jpeg', {
  //       quality: Math.round(quality * 100)
  //     });

  //     // 8. Actualizar imagen en el PDF con verificación de tipos
  //     const newImage = await pdfDoc.embedJpg(compressedBytes);
  //     if (!('setImage' in image)) {
  //       throw new Error('El objeto image no tiene método setImage');
  //     }
  //     //image.setImage(newImage);

  //   } catch (error) {
  //     console.error('Error durante la compresión de imagen:', error);
  //     // Puedes decidir relanzar el error si es crítico
  //     // throw error;
  //   }
  // }

  // private getImageType(bytes: Uint8Array): 'image/jpeg' | 'image/png' | null {
  //   // JPEG magic number
  //   if (bytes.length > 2 && bytes[0] === 0xFF && bytes[1] === 0xD8) return 'image/jpeg';
  //   // PNG magic number
  //   if (bytes.length > 3 && bytes[0] === 0x89 && bytes[1] === 0x50 &&
  //       bytes[2] === 0x4E && bytes[3] === 0x47) return 'image/png';
  //   return null;
  // }

  // isPDFImageExtended(image: any): image is PDFImageExtended {
  //   return image && typeof image.setImage === 'function';
  // }


}
