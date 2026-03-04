const fs = require('fs');

const path = 'src/app/pages/code-formatter/code-formatter.spec.ts';
let content = fs.readFileSync(path, 'utf8');

const pt1 =
    "const mockClipboard = {\n    writeText: (_text: string): Promise<void> => Promise.resolve()\n};\n\nbeforeAll(() => {\n    try {\n        Object.defineProperty(navigator, 'clipboard', {\n            value: mockClipboard,\n            configurable: true,\n            writable: true\n        });\n    } catch (_) {\n        (navigator as any).clipboard = mockClipboard;\n    }\n});";
const pt2 = 'if (!navigator.clipboard) {\n    (navigator as any).clipboard = { writeText: () => Promise.resolve() };\n}';

content = content.replace(pt1, pt2);
content = content.replace("clipboardSpy = spyOn(mockClipboard, 'writeText').and.returnValue(Promise.resolve());", "clipboardSpy = spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve() as any);");

content = content.replace(
    /component\.(selectedLanguage|inputCode|outputCode|inputEditorOptions|outputEditorOptions|autoUpdate|formatCssJs|displaySettings|tabWidth|printWidth|useTabs|singleQuote|isDragging|inputCursor|outputCursor|inputSize|outputSize)\s*=\s*(.*?)(;|\r?\n)/g,
    'component.$1.set($2)$3'
);

content = content.replace(
    /component\.(selectedLanguage|inputCode|outputCode|inputEditorOptions|outputEditorOptions|autoUpdate|formatCssJs|displaySettings|tabWidth|printWidth|useTabs|singleQuote|isDragging|inputCursor|outputCursor|inputSize|outputSize)(?!\.set\()(?![a-zA-Z0-9_])/g,
    'component.$1()'
);

fs.writeFileSync(path, content);
console.log('Fixed code-formatter spec file.');
