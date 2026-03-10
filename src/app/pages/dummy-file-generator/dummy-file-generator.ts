import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

interface FileType {
    label: string;
    value: string;
    mime: string;
}

@Component({
    selector: 'app-dummy-file-generator',
    imports: [CommonModule, FormsModule, SelectModule, InputNumberModule, TextareaModule, ButtonModule, ToastModule],
    providers: [MessageService],
    templateUrl: './dummy-file-generator.html',
    styleUrl: './dummy-file-generator.scss'
})
export class DummyFileGeneratorComponent {
    fileTypes: FileType[] = [
        { label: 'Text Document (.txt)', value: 'txt', mime: 'text/plain' },
        { label: 'CSV File (.csv)', value: 'csv', mime: 'text/csv' },
        { label: 'Log File (.log)', value: 'log', mime: 'text/plain' },
        { label: 'JSON File (.json)', value: 'json', mime: 'application/json' },
        { label: 'PDF Document (.pdf)', value: 'pdf', mime: 'application/pdf' },
        { label: 'HTML File (.html)', value: 'html', mime: 'text/html' },
        { label: 'JPEG Image (.jpg)', value: 'jpg', mime: 'image/jpeg' },
        { label: 'PNG Image (.png)', value: 'png', mime: 'image/png' }
    ];

    selectedFileType: string = 'txt';
    fileSizeInMb: number = 10;
    sampleText: string = 'Generated Dummy Padding Content - ';
    isGenerating: boolean = false;

    constructor(private messageService: MessageService) { }

    generateFile() {
        if (!this.fileSizeInMb || this.fileSizeInMb < 1) {
            this.messageService.add({ severity: 'error', summary: 'Invalid Size', detail: 'File size must be at least 1 MB.' });
            return;
        }

        if (this.fileSizeInMb > 200) {
            this.messageService.add({ severity: 'error', summary: 'Size Too Large', detail: 'File size cannot exceed 200 MB to prevent browser crash.' });
            return;
        }

        if (!this.sampleText?.trim()) {
            this.messageService.add({ severity: 'error', summary: 'Missing Content', detail: 'Sample Text cannot be empty.' });
            return;
        }

        this.isGenerating = true;

        // Use setTimeout to allow UI to update to loading state before heavy JS operations block the thread
        setTimeout(() => {
            try {
                this.processFileGeneration();
            } catch (error) {
                console.error(error);
                this.messageService.add({ severity: 'error', summary: 'Generation Failed', detail: 'An error occurred while generating the file.' });
                this.isGenerating = false;
            }
        }, 50);
    }

    private processFileGeneration() {
        const totalBytes = this.fileSizeInMb * 1024 * 1024;
        let finalBuffer: Uint8Array;

        const typeInfo = this.fileTypes.find(t => t.value === this.selectedFileType) || this.fileTypes[0];

        // Handling file formats with headers (PDF, HTML, Images) to make them minimally valid
        if (this.selectedFileType === 'pdf') {
            finalBuffer = this.generatePdfBuffer(totalBytes, this.sampleText);
        } else if (this.selectedFileType === 'html') {
            finalBuffer = this.generateHtmlBuffer(totalBytes, this.sampleText);
        } else if (this.selectedFileType === 'jpg') {
            finalBuffer = this.generateJpgBuffer(totalBytes, this.sampleText);
        } else if (this.selectedFileType === 'png') {
            finalBuffer = this.generatePngBuffer(totalBytes, this.sampleText);
        } else if (this.selectedFileType === 'json') {
            finalBuffer = this.generateJsonBuffer(totalBytes, this.sampleText);
        } else {
            // General text formats
            finalBuffer = this.generateTextBuffer(totalBytes, this.sampleText);
        }

        // Trigger download
        const blob = new Blob([finalBuffer as any], { type: typeInfo.mime });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `dummy_${this.fileSizeInMb}mb.${this.selectedFileType}`;
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        this.isGenerating = false;
        this.messageService.add({ severity: 'success', summary: 'Success', detail: `File generated and download started: dummy_${this.fileSizeInMb}mb.${this.selectedFileType}` });
    }

    private generateTextBuffer(totalBytes: number, text: string): Uint8Array {
        const buffer = new Uint8Array(totalBytes);
        const encoder = new TextEncoder();
        const encodedText = encoder.encode(text);

        this.fillBuffer(buffer, encodedText, 0, totalBytes);
        return buffer;
    }

    private generateHtmlBuffer(totalBytes: number, text: string): Uint8Array {
        const buffer = new Uint8Array(totalBytes);
        const encoder = new TextEncoder();

        const header = encoder.encode('<!DOCTYPE html>\n<html>\n<head><title>Dummy File</title></head>\n<body>\n<p>');
        const footer = encoder.encode('</p>\n</body>\n</html>');
        const encodedText = encoder.encode(text);

        buffer.set(header, 0);
        const fillEnd = Math.max(header.length, totalBytes - footer.length);

        this.fillBuffer(buffer, encodedText, header.length, fillEnd);

        // Inject footer at the end, possibly overwriting exact padding
        if (totalBytes > footer.length) {
            buffer.set(footer, totalBytes - footer.length);
        }
        return buffer;
    }

    private generateJsonBuffer(totalBytes: number, text: string): Uint8Array {
        const buffer = new Uint8Array(totalBytes);
        const encoder = new TextEncoder();

        const header = encoder.encode('{\n  "data": "');
        const footer = encoder.encode('"\n}');
        // Escape quotes in text just in case
        const safeText = text.replace(/"/g, '\\"');
        const encodedText = encoder.encode(safeText);

        buffer.set(header, 0);
        const fillEnd = Math.max(header.length, totalBytes - footer.length);

        this.fillBuffer(buffer, encodedText, header.length, fillEnd);

        if (totalBytes > footer.length) {
            buffer.set(footer, totalBytes - footer.length);
        }
        return buffer;
    }

    private generatePdfBuffer(totalBytes: number, text: string): Uint8Array {
        const buffer = new Uint8Array(totalBytes);
        const encoder = new TextEncoder();

        // Very basic valid empty PDF skeleton
        const headerStr = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n` +
            `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n` +
            `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\n`;
        const footerStr = `\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000117 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n188\n%%EOF\n`;

        const header = encoder.encode(headerStr);
        const footer = encoder.encode(footerStr);
        const encodedText = encoder.encode(`% Dummy padding: ${text}`);

        buffer.set(header, 0);
        const fillEnd = Math.max(header.length, totalBytes - footer.length);

        this.fillBuffer(buffer, encodedText, header.length, fillEnd);

        if (totalBytes > footer.length) {
            buffer.set(footer, totalBytes - footer.length);
        }
        return buffer;
    }

    private generateJpgBuffer(totalBytes: number, text: string): Uint8Array {
        const buffer = new Uint8Array(totalBytes);

        // Minimal Valid JPEG Header (SOI, and APP0) + EOI Footer
        // FFD8 (Start of Image), FFE0 (APP0 marker), length, identifier "JFIF\0"
        const header = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00]);
        const footer = new Uint8Array([0xFF, 0xD9]); // End of Image

        const encoder = new TextEncoder();
        const encodedText = encoder.encode(text);

        buffer.set(header, 0);
        const fillEnd = Math.max(header.length, totalBytes - footer.length);

        this.fillBuffer(buffer, encodedText, header.length, fillEnd);

        if (totalBytes > footer.length) {
            buffer.set(footer, totalBytes - footer.length);
        }
        return buffer;
    }

    private generatePngBuffer(totalBytes: number, text: string): Uint8Array {
        const buffer = new Uint8Array(totalBytes);

        // Minimal PNG signature and IHDR chunk
        const header = new Uint8Array([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG magic number
            0x00, 0x00, 0x00, 0x0D, // IHDR chunk length (13)
            0x49, 0x48, 0x44, 0x52, // "IHDR"
            0x00, 0x00, 0x00, 0x01, // Width 1
            0x00, 0x00, 0x00, 0x01, // Height 1
            0x08, 0x06, 0x00, 0x00, 0x00, // Bit depth, color type, etc.
            0x1F, 0x15, 0xC4, 0x89  // CRC (dummy)
        ]);

        const footer = new Uint8Array([
            0x00, 0x00, 0x00, 0x00, // IEND chunk length (0)
            0x49, 0x45, 0x4E, 0x44, // "IEND"
            0xAE, 0x42, 0x60, 0x82  // CRC
        ]);

        const encoder = new TextEncoder();
        // Pack text into a dummy chunk like tEXt to keep PNG structure somewhat intact 
        // (but since it's just padding, we'll append it before IEND)
        const encodedText = encoder.encode(text);

        buffer.set(header, 0);
        const fillEnd = Math.max(header.length, totalBytes - footer.length);

        this.fillBuffer(buffer, encodedText, header.length, fillEnd);

        if (totalBytes > footer.length) {
            buffer.set(footer, totalBytes - footer.length);
        }
        return buffer;
    }

    private fillBuffer(buffer: Uint8Array, pattern: Uint8Array, start: number, end: number) {
        if (pattern.length === 0) return;

        let position = start;
        while (position < end) {
            const remaining = end - position;
            const toCopy = remaining < pattern.length ? pattern.subarray(0, remaining) : pattern;
            buffer.set(toCopy, position);
            position += toCopy.length;
        }
    }
}
