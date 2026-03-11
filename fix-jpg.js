const fs = require('fs');
const file = 'd:/Projects/sakai-ng/src/app/pages/dummy-file-generator/dummy-file-generator.ts';
let code = fs.readFileSync(file, 'utf8');
const start = code.indexOf('    private generateJpgBuffer');
const end = code.indexOf('    private generatePngBuffer');

const baseImgMethod = `    private createBaseImageWithText(text: string, mimeType: 'image/jpeg' | 'image/png'): Uint8Array {
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
            
            const asciiContent = text.replace(/[^\\x20-\\x7E\\s]/g, '');
            const displayContent = (asciiContent.trim().length > 0 ? asciiContent : 'Dummy Image Content').trim();
            
            const words = displayContent.split(/\\s+/);
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
            const encodedText = encoder.encode(text + '\\n');
            
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

`;

const newCode = code.substring(0, start) + baseImgMethod + code.substring(end);
fs.writeFileSync(file, newCode);
console.log('Fixed JPG buffer code');
