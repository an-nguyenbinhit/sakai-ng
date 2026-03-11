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

        const typeInfo = this.fileTypes.find((t) => t.value === this.selectedFileType) || this.fileTypes[0];

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

        // Extract some ASCII text to render visibly on the first page
        const asciiContent = text.replace(/[^\x20-\x7E]/g, '');
        const displayContent = (asciiContent.length > 0 ? asciiContent : 'Dummy PDF Content')
            .substring(0, 100)
            .replace(/\\/g, '\\\\')
            .replace(/\(/g, '\\(')
            .replace(/\)/g, '\\)');

        const contentStream = `BT\n/F1 24 Tf\n50 700 Td\n(${displayContent}) Tj\nET\n`;
        const contentLen = contentStream.length;

        const obj1 = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
        const obj2 = `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`;
        const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`;
        const obj4 = `4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`;
        const obj5 = `5 0 obj\n<< /Length ${contentLen} >>\nstream\n${contentStream}endstream\nendobj\n`;

        const pdfSig = `%PDF-1.4\n`;
        
        const obj1Loc = pdfSig.length;
        const obj2Loc = obj1Loc + obj1.length;
        const obj3Loc = obj2Loc + obj2.length;
        const obj4Loc = obj3Loc + obj3.length;
        const obj5Loc = obj4Loc + obj4.length;

        const headerStr = pdfSig + obj1 + obj2 + obj3 + obj4 + obj5;
        const header = encoder.encode(headerStr);

        buffer.set(header, 0);

        const paddingPrefix = encoder.encode('% ');
        const paddingNewline = encoder.encode('\n');
        const encodedText = encoder.encode(text);

        // Reserve space for the cross-reference table and trailer
        const footerSpace = 400;
        const paddingEnd = totalBytes - footerSpace;
        let currentPos = header.length;

        // Fill padding with the full text (including unicode) as comments
        while (currentPos < paddingEnd) {
            if (currentPos + paddingPrefix.length <= paddingEnd) {
                buffer.set(paddingPrefix, currentPos);
                currentPos += paddingPrefix.length;
            } else { break; }

            const spaceLeft = paddingEnd - currentPos;
            const toCopy = spaceLeft < encodedText.length ? encodedText.subarray(0, spaceLeft) : encodedText;
            if (toCopy.length > 0) {
                buffer.set(toCopy, currentPos);
                currentPos += toCopy.length;
            }

            if (currentPos >= paddingEnd - 1) {
                buffer.set(paddingNewline, currentPos);
                currentPos += paddingNewline.length;
                break;
            }
        }

        buffer[currentPos - 1] = 0x0A; // Ensure ends with newline

        const xrefStart = currentPos;
        const footerStr = `xref\n0 6\n0000000000 65535 f \n` +
            `${obj1Loc.toString().padStart(10, '0')} 00000 n \n` +
            `${obj2Loc.toString().padStart(10, '0')} 00000 n \n` +
            `${obj3Loc.toString().padStart(10, '0')} 00000 n \n` +
            `${obj4Loc.toString().padStart(10, '0')} 00000 n \n` +
            `${obj5Loc.toString().padStart(10, '0')} 00000 n \n` +
            `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

        const eofStr = '\n%%EOF\n';
        const eofBin = encoder.encode(eofStr);
        const trailerPart = encoder.encode(footerStr.replace(eofStr, ''));

        buffer.set(trailerPart, currentPos);
        currentPos += trailerPart.length;

        // Pad spaces before the final EOF
        while (currentPos < totalBytes - eofBin.length) {
            buffer[currentPos] = 0x20;
            currentPos++;
        }

        buffer.set(eofBin, currentPos);

        return buffer;
    }

    private generateJpgBuffer(totalBytes: number, text: string): Uint8Array {
        const buffer = new Uint8Array(totalBytes);

        // 1x1 fully valid JPEG structure
        // minimal gray image
        const rawJpg = new Uint8Array([
            0xFF, 0xD8, // SOI
            0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, // APP0
            0xFF, 0xDB, 0x00, 0x43, 0x00, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, // DQT
            0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00, // SOF0
            0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03, // DHT
            0xFF, 0xC4, 0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // DHT
            0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00, // SOS
            0x3F, 0x00, // image data
            0xFF, 0xD9 // EOI
        ]);

        const eoiLength = 2; // EOI is last 2 bytes FFD9
        const header = rawJpg.subarray(0, rawJpg.length - eoiLength);
        const footer = rawJpg.subarray(rawJpg.length - eoiLength);

        buffer.set(header, 0);

        let currentPos = header.length;
        const encoder = new TextEncoder();
        const encodedText = encoder.encode(text);

        // We inject COM (Comment) segments: 0xFF 0xFE <length_high> <length_low> <data>
        // Max segment data size is 65533 (65535 - 2 bytes for length)

        while (currentPos < totalBytes - eoiLength) {
            const bytesRemaining = (totalBytes - eoiLength) - currentPos;

            // Need at least 4 bytes for a COM marker
            if (bytesRemaining < 4) {
                // Not enough room for a marker segment, just pad before EOI 
                // Technically invalid strictly but safely ignored by readers after image data
                while (currentPos < totalBytes - eoiLength) {
                    buffer[currentPos] = 0x00;
                    currentPos++;
                }
                break;
            }

            const segmentSize = Math.min(bytesRemaining, 65535);
            const dataSize = segmentSize - 2; // 2 bytes for length value itself

            buffer[currentPos++] = 0xFF;
            buffer[currentPos++] = 0xFE; // COM marker
            buffer[currentPos++] = (segmentSize >> 8) & 0xFF; // Length high
            buffer[currentPos++] = segmentSize & 0xFF; // Length low

            // Fill segment data
            const segmentEnd = currentPos + dataSize;
            while (currentPos < segmentEnd) {
                const spaceLeft = segmentEnd - currentPos;
                const toCopy = spaceLeft < encodedText.length ? encodedText.subarray(0, spaceLeft) : encodedText;
                if (toCopy.length > 0) {
                    buffer.set(toCopy, currentPos);
                    currentPos += toCopy.length;
                } else {
                    // Fallback
                    buffer[currentPos++] = 0x20;
                }
            }
        }

        buffer.set(footer, currentPos);

        return buffer;
    }

    private generatePngBuffer(totalBytes: number, text: string): Uint8Array {
        const buffer = new Uint8Array(totalBytes);

        // 1x1 fully valid PNG signature, IHDR, IDAT
        const rawPng = new Uint8Array([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // Signature
            0x00, 0x00, 0x00, 0x0D, // IHDR len 13
            0x49, 0x48, 0x44, 0x52, // "IHDR"
            0x00, 0x00, 0x00, 0x01, // width 1
            0x00, 0x00, 0x00, 0x01, // height 1
            0x08, 0x06, 0x00, 0x00, 0x00, // RGBA, depth 8
            0x1F, 0x15, 0xC4, 0x89, // IHDR CRC

            0x00, 0x00, 0x00, 0x0D, // IDAT len 13
            0x49, 0x44, 0x41, 0x54, // "IDAT"
            0x08, 0x1D, 0x01, 0x05, 0x00, 0xFA, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00, // IDAT Data
            0x01, 0xA8, 0x2A, 0x80, // IDAT CRC (dummy but fine for 1x1 empty)

            0x00, 0x00, 0x00, 0x00, // IEND length 0
            0x49, 0x45, 0x4E, 0x44, // "IEND"
            0xAE, 0x42, 0x60, 0x82  // IEND CRC
        ]);

        const iendChunkLen = 12; // Length(4) + Type(4) + CRC(4)
        const header = rawPng.subarray(0, rawPng.length - iendChunkLen);
        const footer = rawPng.subarray(rawPng.length - iendChunkLen);

        buffer.set(header, 0);

        let currentPos = header.length;
        const encoder = new TextEncoder();
        const encodedText = encoder.encode(text);

        // We inject custom tEXt chunks: length(4) + "tEXt"(4) + keyword(1) + \0 + text + CRC(4)
        // Max chunk size in standard PNG is 2^31 - 1, we can just make one huge custom chunk

        const chunkType = encoder.encode('zPAd'); // Custom unknown ancillary chunk safe to ignore

        const availableSpace = totalBytes - currentPos - footer.length;

        if (availableSpace >= 12) {
            const dataLen = availableSpace - 12; // 4 len + 4 type + 4 crc

            // Len
            buffer[currentPos++] = (dataLen >>> 24) & 0xFF;
            buffer[currentPos++] = (dataLen >>> 16) & 0xFF;
            buffer[currentPos++] = (dataLen >>> 8) & 0xFF;
            buffer[currentPos++] = dataLen & 0xFF;

            // Type
            buffer.set(chunkType, currentPos);
            currentPos += 4;

            // Data
            const dataStart = currentPos;
            const dataEnd = currentPos + dataLen;
            while (currentPos < dataEnd) {
                const spaceLeft = dataEnd - currentPos;
                const toCopy = spaceLeft < encodedText.length ? encodedText.subarray(0, spaceLeft) : encodedText;
                if (toCopy.length > 0) {
                    buffer.set(toCopy, currentPos);
                    currentPos += toCopy.length;
                } else {
                    buffer[currentPos++] = 0x20;
                }
            }

            // CRC (Fake CRC is fine for ignored custom chunk)
            buffer[currentPos++] = 0xDE;
            buffer[currentPos++] = 0xAD;
            buffer[currentPos++] = 0xBE;
            buffer[currentPos++] = 0xEF;
        } else {
            // Not enough space for a valid chunk, just pad with 0s (invalid strict PNG but accepted mostly)
            while (currentPos < totalBytes - footer.length) {
                buffer[currentPos++] = 0x00;
            }
        }

        buffer.set(footer, currentPos);

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
