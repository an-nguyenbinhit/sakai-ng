const fs = require('fs');
const file = 'd:/Projects/sakai-ng/src/app/pages/dummy-file-generator/dummy-file-generator.ts';
let code = fs.readFileSync(file, 'utf8');

// Replace JSON Buffer generation
const searchJSONFunc = `    private generateJsonBuffer(totalBytes: number, text: string): Uint8Array {
        const buffer = new Uint8Array(totalBytes);
        const encoder = new TextEncoder();

        const header = encoder.encode('{\\n  "data": "');
        const footer = encoder.encode('"\\n}');
        // Escape quotes in text just in case
        const safeText = text.replace(/"/g, '\\\\"');
        const encodedText = encoder.encode(safeText);

        buffer.set(header, 0);
        const fillEnd = Math.max(header.length, totalBytes - footer.length);

        this.fillBuffer(buffer, encodedText, header.length, fillEnd);

        if (totalBytes > footer.length) {
            buffer.set(footer, totalBytes - footer.length);
        }
        return buffer;
    }`;

const replaceJSONFunc = `    private generateJsonBuffer(totalBytes: number, text: string): Uint8Array {
        const buffer = new Uint8Array(totalBytes);
        const encoder = new TextEncoder();

        const header = encoder.encode('[\\n');
        const footer = encoder.encode('\\n]');
        
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
                    itemObj[field.name] = text.substring(0, 20).replace(/[\\"\\n]/g, '') + ' ' + Math.random().toString(36).substring(7);
                } else if (field.type === 'number') {
                    itemObj[field.name] = Math.floor(Math.random() * 1000000);
                } else if (field.type === 'boolean') {
                    itemObj[field.name] = Math.random() > 0.5;
                }
            }

            let itemString = JSON.stringify(itemObj);
            if (!isFirst) {
                itemString = ',\\n  ' + itemString;
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
    }`;

code = code.replace(searchJSONFunc, replaceJSONFunc);
fs.writeFileSync(file, code);
console.log('Fixed JSON generator buffer logic');
