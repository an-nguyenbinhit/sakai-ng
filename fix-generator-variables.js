const fs = require('fs');
const file = 'd:/Projects/sakai-ng/src/app/pages/dummy-file-generator/dummy-file-generator.ts';
let code = fs.readFileSync(file, 'utf8');

// Insert variables
code = code.replace(
    /sampleText: string = 'Generated Dummy Padding Content - ';/g,
    `sampleText: string = 'Generated Dummy Padding Content - ';
    addRandomNoise: boolean = false;
    progressValue: number = 0;
    
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
    }`
);

// Process chunking base
code = code.replace(
    /finalBuffer = this.generateTextBuffer\(totalBytes, textToUse\);\n        }/g,
    `finalBuffer = this.generateTextBuffer(totalBytes, textToUse);
        }

        // Apply Random Noise if enabled
        if (this.addRandomNoise && finalBuffer.length >= 36) {
            const noise = crypto.randomUUID();
            const encoder = new TextEncoder();
            const noiseBytes = encoder.encode(noise);
            finalBuffer.set(noiseBytes, finalBuffer.length - noiseBytes.length);
        }

        this.progressValue = 100;`
);


fs.writeFileSync(file, code);
console.log('Fixed TS file.');
