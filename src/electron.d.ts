export { };

interface Printer {
    name: string;
    displayName: string;
    description?: string;
    status: number;
    isDefault: boolean;
}

interface DataImpresionCredencial {
    curp: string;
    photoPath: string;
    nombreBeneficiario: string;
    fechaExpedicion: string;
    telefono: string;
    printer: string;
}

declare global {
    interface Window {
        electronAPI?: {
            selectFolder: () => Promise<string | null>;
            getImage: (imageName: string, path: string) => Promise<ArrayBuffer>;
            getFile: (fileName: string) => Promise<ArrayBuffer>;
            getDigitalizedFile: (fileName: string) => Promise<ArrayBuffer>;
            getAppPath: () => Promise<string>;
            getFilteredFiles: () => Promise<string>;
            getSerialNumber: () => Promise<string>;
            savePhoto: (imageData: ArrayBuffer | string, name: string, path: string) => void;
            savePdf: (pdfData: ArrayBuffer, fileName: string) => Promise<string>;
            getPrinters: () => Promise<Printer[]>;
            printIdCard: (data: DataImpresionCredencial, manual: boolean) => Promise<void>;
        };
    }
}
