import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { ProgressBarModule } from 'primeng/progressbar';
import { TextareaModule } from 'primeng/textarea';
import { EditorModule } from 'primeng/editor';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

interface FileType {
    label: string;
    value: string;
    mime: string;
}

export interface JsonField {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'uuid';
}

@Component({
    selector: 'app-dummy-file-generator',
    imports: [CommonModule, FormsModule, SelectModule, InputNumberModule, InputTextModule, EditorModule, CheckboxModule, ProgressBarModule, ButtonModule, ToastModule],
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
    addRandomNoise: boolean = false;
    progressValue: number = 0;

    // --- Format helpers ---
    isPlainTextFormat(): boolean {
        return ['txt', 'log', 'csv'].includes(this.selectedFileType);
    }
    isRichTextFormat(): boolean {
        return ['html', 'pdf'].includes(this.selectedFileType);
    }
    isImageFormat(): boolean {
        return ['jpg', 'png'].includes(this.selectedFileType);
    }

    onFileTypeChange(): void {
        // Reset sampleText with a sensible default per format group
        if (this.isImageFormat()) {
            this.sampleText = 'Dummy Image Content';
        } else if (this.isRichTextFormat()) {
            this.sampleText = '<p>Generated Dummy Padding Content</p>';
        } else if (this.isPlainTextFormat()) {
            this.sampleText = 'Generated Dummy Padding Content - ';
        }
    }
    
    // JSON Schema Builder
    jsonSchema: JsonField[] = [
        { name: 'id', type: 'uuid' },
        { name: 'name', type: 'string' },
        { name: 'isActive', type: 'boolean' }
    ];

    addJsonField() {
        this.jsonSchema.push({ name: 'field' + (this.jsonSchema.length + 1), type: 'string' });
    }

    removeJsonField(index: number) {
        if (this.jsonSchema.length > 1) {
            this.jsonSchema.splice(index, 1);
        }
    }
    isGenerating: boolean = false;

    constructor(private messageService: MessageService) { }

    private decodeHtmlEntities(html: string): string {
        const txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    }

    generateFile() {
        if (!this.fileSizeInMb || this.fileSizeInMb < 1) {
            this.messageService.add({ severity: 'error', summary: 'Invalid Size', detail: 'File size must be at least 1 MB.' });
            return;
        }

        if (this.fileSizeInMb > 200) {
            this.messageService.add({ severity: 'error', summary: 'Size Too Large', detail: 'File size cannot exceed 200 MB to prevent browser crash.' });
            return;
        }

        let cleanedText = this.sampleText;
        // Image formats accept empty/short captions — use a fallback instead of blocking
        if (this.isImageFormat()) {
            cleanedText = cleanedText?.trim() || 'Dummy Image Content';
        } else {
            if (!cleanedText?.trim() || cleanedText === '<p><br></p>') {
                this.messageService.add({ severity: 'error', summary: 'Missing Content', detail: 'Sample Text cannot be empty.' });
                return;
            }
            if (this.selectedFileType !== 'html') {
                // Strip HTML tags then decode entities (e.g. &nbsp; → space)
                const stripped = cleanedText.replace(/<[^>]*>?/gm, '');
                cleanedText = this.decodeHtmlEntities(stripped).trim();
            }
        }

        this.isGenerating = true;
        this.progressValue = 0;

        // Use setTimeout to allow UI to update to loading state before heavy JS operations block the thread
        setTimeout(() => {
            try {
                this.processFileGenerationChunked(cleanedText);
            } catch (error) {
                console.error(error);
                this.isGenerating = false;
                this.messageService.add({ severity: 'error', summary: 'Generation Failed', detail: 'An error occurred while generating the file.' });
            }
        }, 50);
    }

    private processFileGenerationChunked(textToUse: string) {
        const totalBytes = this.fileSizeInMb * 1024 * 1024;
        let finalBuffer: Uint8Array;

        const typeInfo = this.fileTypes.find((t) => t.value === this.selectedFileType) || this.fileTypes[0];

        // Handling file formats with headers (PDF, HTML, Images) to make them minimally valid
        if (this.selectedFileType === 'pdf') {
            finalBuffer = this.generatePdfBuffer(totalBytes, textToUse);
        } else if (this.selectedFileType === 'html') {
            finalBuffer = this.generateHtmlBuffer(totalBytes, textToUse);
        } else if (this.selectedFileType === 'jpg') {
            finalBuffer = this.generateJpgBuffer(totalBytes, textToUse);
        } else if (this.selectedFileType === 'png') {
            finalBuffer = this.generatePngBuffer(totalBytes, textToUse);
        } else if (this.selectedFileType === 'json') {
            finalBuffer = this.generateJsonBuffer(totalBytes, textToUse);
        } else {
            // General text formats
            finalBuffer = this.generateTextBuffer(totalBytes, textToUse);
        }

        // Apply Random Noise if enabled
        if (this.addRandomNoise && finalBuffer.length >= 36) {
            const noise = crypto.randomUUID();
            const encoder = new TextEncoder();
            const noiseBytes = encoder.encode(noise);
            finalBuffer.set(noiseBytes, finalBuffer.length - noiseBytes.length);
        }

        this.progressValue = 100;

        this.progressValue = 100;

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

        const header = encoder.encode('[\n');
        const footer = encoder.encode('\n]');
        
        buffer.set(header, 0);
        
        const fillEnd = Math.max(header.length, totalBytes - footer.length);
        let currentPos = header.length;
        let isFirst = true;

        const maxItemLength = 2000; 

        while (currentPos < fillEnd) {
            let itemObj: any = {};
            
            for (const field of this.jsonSchema) {
                if (field.type === 'uuid') {
                    itemObj[field.name] = crypto.randomUUID();
                } else if (field.type === 'string') {
                    itemObj[field.name] = text.substring(0, 20).replace(/[\"\n]/g, '') + ' ' + Math.random().toString(36).substring(7);
                } else if (field.type === 'number') {
                    itemObj[field.name] = Math.floor(Math.random() * 1000000);
                } else if (field.type === 'boolean') {
                    itemObj[field.name] = Math.random() > 0.5;
                }
            }

            let itemString = JSON.stringify(itemObj);
            if (!isFirst) {
                itemString = ',\n  ' + itemString;
            } else {
                itemString = '  ' + itemString;
                isFirst = false;
            }

            let encodedItem = encoder.encode(itemString);
            
            // If the encoded item would exceed our fill limit, pad with spaces and break
            if (currentPos + encodedItem.length > fillEnd) {
                const remaining = fillEnd - currentPos;
                for(let i = 0; i < remaining; i++) {
                     buffer[currentPos + i] = 0x20; 
                }
                currentPos = fillEnd;
                break;
            }

            buffer.set(encodedItem, currentPos);
            currentPos += encodedItem.length;
            
            // Rough progress update (every ~1MB or 10% generated) to keep UI responsive
            if (currentPos % (1024 * 1024) < encodedItem.length) {
                 this.progressValue = Math.floor((currentPos / totalBytes) * 100);
            }
        }
        
        this.progressValue = 100;

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

    private createBaseImageWithText(text: string, mimeType: 'image/jpeg' | 'image/png'): Uint8Array {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 30px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const asciiContent = text.replace(/[^\x20-\x7E\s]/g, '');
            const displayContent = (asciiContent.trim().length > 0 ? asciiContent : 'Dummy Image Content').trim();
            
            const words = displayContent.split(/\s+/);
            let line = '';
            const lines = [];
            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                const metrics = ctx.measureText(testLine);
                if (metrics.width > canvas.width - 100 && n > 0) {
                    lines.push(line);
                    line = words[n] + ' ';
                } else {
                    line = testLine;
                }
            }
            lines.push(line);
            
            let y = canvas.height / 2 - (lines.length * 40) / 2;
            for (const l of lines) {
                ctx.fillText(l.substring(0, 100).trim(), canvas.width / 2, y);
                y += 40;
                if (y > canvas.height - 50) break; 
            }
        }
        
        const dataUrl = canvas.toDataURL(mimeType, 0.9);
        const base64 = dataUrl.split(',')[1];
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }

    private generateJpgBuffer(totalBytes: number, text: string): Uint8Array {
        const buffer = new Uint8Array(totalBytes);
        const rawImage = this.createBaseImageWithText(text, 'image/jpeg');
        
        const copyLength = Math.min(rawImage.length, totalBytes);
        buffer.set(rawImage.subarray(0, copyLength), 0);
        
        if (copyLength < totalBytes) {
            const encoder = new TextEncoder();
            const encodedText = encoder.encode(text + '\n');
            
            let currentPos = copyLength;
            while (currentPos < totalBytes) {
                const spaceLeft = totalBytes - currentPos;
                const toCopy = spaceLeft < encodedText.length ? encodedText.subarray(0, spaceLeft) : encodedText;
                if (toCopy.length > 0) {
                    buffer.set(toCopy, currentPos);
                    currentPos += toCopy.length;
                } else {
                    buffer[currentPos++] = 0x20;
                }
            }
        }
        
        return buffer;
    }

    private generatePngBuffer(totalBytes: number, text: string): Uint8Array {
        const buffer = new Uint8Array(totalBytes);
        const rawImage = this.createBaseImageWithText(text, 'image/png');
        
        const copyLength = Math.min(rawImage.length, totalBytes);
        buffer.set(rawImage.subarray(0, copyLength), 0);
        
        if (copyLength < totalBytes) {
            const encoder = new TextEncoder();
            const encodedText = encoder.encode(text + '\n');
            
            let currentPos = copyLength;
            while (currentPos < totalBytes) {
                const spaceLeft = totalBytes - currentPos;
                const toCopy = spaceLeft < encodedText.length ? encodedText.subarray(0, spaceLeft) : encodedText;
                if (toCopy.length > 0) {
                    buffer.set(toCopy, currentPos);
                    currentPos += toCopy.length;
                } else {
                    buffer[currentPos++] = 0x20;
                }
            }
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
