/**
 * PostToolUse hook: detect UI file changes and prompt playwright-mcp verification.
 *
 * Triggered after Edit/Write/MultiEdit tool calls.
 * Outputs additionalContext JSON to inject verification instructions into Claude's context.
 */

// Extensions considered as UI files
const UI_EXTENSIONS = /\.(ts|html|scss|css)$/;

// Exclude non-UI TypeScript files
const EXCLUDE_SUFFIXES = /\.(spec\.ts|service\.ts|config\.ts|guard\.ts|interceptor\.ts|pipe\.ts|resolver\.ts|module\.ts)$/;

// Must be inside src/app/
const SRC_APP = /src[/\\]app[/\\]/;

async function readStdin() {
    return new Promise((resolve) => {
        let data = '';
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', (chunk) => (data += chunk));
        process.stdin.on('end', () => resolve(data));
        // Fallback timeout (Windows stdin may hang)
        setTimeout(() => resolve(data || '{}'), 2000);
    });
}

function isUIFile(filePath) {
    if (!filePath) return false;
    return UI_EXTENSIONS.test(filePath) && SRC_APP.test(filePath) && !EXCLUDE_SUFFIXES.test(filePath);
}

async function main() {
    try {
        const raw = await readStdin();
        const input = JSON.parse(raw || '{}');

        const filePath = input?.tool_input?.file_path || '';

        if (!isUIFile(filePath)) return;

        // Normalize path for display
        const match = filePath.match(/src[/\\]app[/\\].+/);
        const displayPath = match ? match[0].replace(/\\/g, '/') : filePath;

        const result = {
            additionalContext: [
                `UI file modified: ${displayPath}`,
                `Since this is a UI task, please verify the changes using playwright-mcp:`,
                `1. Ensure the dev server is running (npm start → http://localhost:4200)`,
                `2. Use playwright-mcp to navigate to the relevant page`,
                `3. Take a screenshot to confirm the UI renders correctly`,
                `4. Check for visual regressions, layout issues, or console errors`
            ].join('\n')
        };

        process.stdout.write(JSON.stringify(result));
    } catch {
        // Silently exit — never block the workflow
        process.exit(0);
    }
}

main();
