const fs = require('fs');

const path = 'src/app/pages/regex-tester/regex-tester.spec.ts';
let content = fs.readFileSync(path, 'utf8');

// The global mock clipboard override in regex-tester.spec.ts hasn't been written to before, let's fix it anyway if it exists
const pt1 = "const mockClipboard = {\n    writeText: (_text: string): Promise<void> => Promise.resolve()\n};\n\nbeforeAll(() => {\n    try {\n        Object.defineProperty(navigator, 'clipboard', {\n            value: mockClipboard,\n            configurable: true,\n            writable: true\n        });\n    } catch (_) {\n        (navigator as any).clipboard = mockClipboard;\n    }\n});";
const pt2 = "if (!navigator.clipboard) {\n    (navigator as any).clipboard = { writeText: () => Promise.resolve() };\n}";

content = content.replace(pt1, pt2);
content = content.replace(
    "clipboardSpy = spyOn(mockClipboard, 'writeText').and.returnValue(Promise.resolve());",
    "clipboardSpy = spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve() as any);"
);

// Regex tester properties
const signals = [
    'pattern', 'testString', 'flagG', 'flagI', 'flagM',
    'matches', 'highlightedHtml', 'regexError', 'cheatSheetVisible'
];

signals.forEach(sig => {
    const escapedSig = sig.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Replace assignments: component.pattern = 'foo'; -> component.pattern.set('foo');
    const assignRegexStr = "component\\\\." + escapedSig + "\\\\s*=\\\\s*(.*?)(;|\\\\r?\\\\n)";
    const assignRegex = new RegExp(assignRegexStr, 'g');

    content = content.replace(assignRegex, function (match, val, endChar) {
        return "component." + sig + ".set(" + val + ")" + endChar;
    });

    // Replace reads: component.pattern -> component.pattern()
    const readRegexStr = "component\\\\." + escapedSig + "(?!\\\\.set\\\\()(?![a-zA-Z0-9_])";
    const readRegex = new RegExp(readRegexStr, 'g');
    content = content.replace(readRegex, "component." + sig + "()");
});

fs.writeFileSync(path, content);
console.log('Fixed regex-tester spec file.');
