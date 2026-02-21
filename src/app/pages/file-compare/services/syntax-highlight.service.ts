import { Injectable } from '@angular/core';

const EXTENSION_MAP: Record<string, string> = {
    '.ts': 'typescript',
    '.tsx': 'tsx',
    '.js': 'javascript',
    '.jsx': 'jsx',
    '.mjs': 'javascript',
    '.py': 'python',
    '.java': 'java',
    '.cs': 'csharp',
    '.cpp': 'cpp',
    '.c': 'c',
    '.h': 'c',
    '.go': 'go',
    '.rs': 'rust',
    '.rb': 'ruby',
    '.php': 'php',
    '.swift': 'swift',
    '.kt': 'kotlin',
    '.scala': 'scala',
    '.html': 'markup',
    '.htm': 'markup',
    '.xml': 'xml',
    '.svg': 'markup',
    '.css': 'css',
    '.scss': 'scss',
    '.sass': 'sass',
    '.less': 'less',
    '.json': 'json',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.toml': 'toml',
    '.md': 'markdown',
    '.sql': 'sql',
    '.sh': 'bash',
    '.bash': 'bash',
    '.zsh': 'bash',
    '.bat': 'batch',
    '.ps1': 'powershell',
    '.dockerfile': 'docker',
    '.graphql': 'graphql',
    '.gql': 'graphql',
    '.r': 'r',
    '.dart': 'dart',
    '.lua': 'lua',
    '.perl': 'perl',
    '.pl': 'perl'
};

@Injectable({ providedIn: 'root' })
export class SyntaxHighlight {
    private loadedLanguages = new Set<string>();
    private prismLoaded = false;

    detectLanguage(filename: string): string {
        if (!filename || filename === 'untitled') return 'plaintext';
        const lowerName = filename.toLowerCase();
        const dotIndex = lowerName.lastIndexOf('.');
        if (dotIndex === -1) {
            // Check special filenames
            if (lowerName === 'dockerfile') return 'docker';
            if (lowerName === 'makefile') return 'makefile';
            return 'plaintext';
        }
        const ext = lowerName.substring(dotIndex);
        return EXTENSION_MAP[ext] ?? 'plaintext';
    }

    async loadPrism(): Promise<void> {
        if (this.prismLoaded) return;
        // Prism is imported globally via the bundle
        // We need to import it
        try {
            await import('prismjs');
            this.prismLoaded = true;
        } catch {
            // Silently fail — no syntax highlighting
        }
    }

    async loadLanguage(language: string): Promise<void> {
        if (language === 'plaintext' || this.loadedLanguages.has(language)) return;
        await this.loadPrism();

        try {
            // Load common languages that may not be bundled by default
            const langMap: Record<string, string> = {
                typescript: 'typescript',
                javascript: 'javascript',
                python: 'python',
                java: 'java',
                csharp: 'csharp',
                cpp: 'cpp',
                go: 'go',
                rust: 'rust',
                ruby: 'ruby',
                php: 'php',
                markup: 'markup',
                css: 'css',
                scss: 'scss',
                json: 'json',
                yaml: 'yaml',
                markdown: 'markdown',
                sql: 'sql',
                bash: 'bash',
                kotlin: 'kotlin',
                swift: 'swift',
                dart: 'dart',
                graphql: 'graphql',
                docker: 'docker'
            };

            if (langMap[language]) {
                await import(/* @vite-ignore */ `prismjs/components/prism-${langMap[language]}`);
            }
            this.loadedLanguages.add(language);
        } catch {
            this.loadedLanguages.add(language); // Mark as attempted to avoid retries
        }
    }

    highlightLine(escapedHtml: string, language: string): string {
        if (language === 'plaintext' || !escapedHtml) return escapedHtml;

        try {
            // Prism.highlight expects unescaped text, but we have escaped HTML
            // We need to unescape first, then highlight, then the output replaces tags
            const unescaped = this.unescapeHtml(escapedHtml);
            const prismModule = (window as any).Prism ?? (globalThis as any).Prism;
            if (!prismModule?.languages?.[language]) return escapedHtml;

            return prismModule.highlight(unescaped, prismModule.languages[language], language);
        } catch {
            return escapedHtml;
        }
    }

    private unescapeHtml(text: string): string {
        return text
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");
    }
}
