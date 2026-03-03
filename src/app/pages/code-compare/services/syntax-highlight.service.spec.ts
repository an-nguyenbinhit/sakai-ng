import { TestBed } from '@angular/core/testing';
import { SyntaxHighlight } from './syntax-highlight.service';

describe('SyntaxHighlight', () => {
    let service: SyntaxHighlight;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(SyntaxHighlight);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // detectLanguage()
    // ─────────────────────────────────────────────────────────────────────────
    describe('detectLanguage()', () => {
        // Known extension mappings
        const knownExtensions: { filename: string; expected: string }[] = [
            { filename: 'index.ts', expected: 'typescript' },
            { filename: 'app.tsx', expected: 'tsx' },
            { filename: 'main.js', expected: 'javascript' },
            { filename: 'component.jsx', expected: 'jsx' },
            { filename: 'module.mjs', expected: 'javascript' },
            { filename: 'script.py', expected: 'python' },
            { filename: 'Main.java', expected: 'java' },
            { filename: 'Program.cs', expected: 'csharp' },
            { filename: 'main.cpp', expected: 'cpp' },
            { filename: 'hello.c', expected: 'c' },
            { filename: 'header.h', expected: 'c' },
            { filename: 'server.go', expected: 'go' },
            { filename: 'main.rs', expected: 'rust' },
            { filename: 'app.rb', expected: 'ruby' },
            { filename: 'index.php', expected: 'php' },
            { filename: 'ContentView.swift', expected: 'swift' },
            { filename: 'Main.kt', expected: 'kotlin' },
            { filename: 'App.scala', expected: 'scala' },
            { filename: 'index.html', expected: 'markup' },
            { filename: 'page.htm', expected: 'markup' },
            { filename: 'data.xml', expected: 'xml' },
            { filename: 'icon.svg', expected: 'markup' },
            { filename: 'styles.css', expected: 'css' },
            { filename: 'styles.scss', expected: 'scss' },
            { filename: 'styles.sass', expected: 'sass' },
            { filename: 'styles.less', expected: 'less' },
            { filename: 'data.json', expected: 'json' },
            { filename: 'config.yaml', expected: 'yaml' },
            { filename: 'config.yml', expected: 'yaml' },
            { filename: 'Cargo.toml', expected: 'toml' },
            { filename: 'README.md', expected: 'markdown' },
            { filename: 'query.sql', expected: 'sql' },
            { filename: 'run.sh', expected: 'bash' },
            { filename: 'start.bash', expected: 'bash' },
            { filename: 'profile.zsh', expected: 'bash' },
            { filename: 'build.bat', expected: 'batch' },
            { filename: 'setup.ps1', expected: 'powershell' },
            { filename: '.dockerfile', expected: 'docker' },
            { filename: 'schema.graphql', expected: 'graphql' },
            { filename: 'query.gql', expected: 'graphql' },
            { filename: 'analysis.r', expected: 'r' },
            { filename: 'app.dart', expected: 'dart' },
            { filename: 'script.lua', expected: 'lua' },
            { filename: 'script.perl', expected: 'perl' },
            { filename: 'script.pl', expected: 'perl' }
        ];

        knownExtensions.forEach(({ filename, expected }) => {
            it(`"${filename}" → "${expected}"`, () => {
                expect(service.detectLanguage(filename)).toBe(expected);
            });
        });

        it('is case-insensitive for extensions (e.g. ".TS")', () => {
            expect(service.detectLanguage('Component.TS')).toBe('typescript');
        });

        it('"Dockerfile" (no extension, exact name) → "docker"', () => {
            expect(service.detectLanguage('Dockerfile')).toBe('docker');
        });

        it('"dockerfile" (lowercase) → "docker"', () => {
            expect(service.detectLanguage('dockerfile')).toBe('docker');
        });

        it('"Makefile" (no extension, exact name) → "makefile"', () => {
            expect(service.detectLanguage('Makefile')).toBe('makefile');
        });

        it('"makefile" (lowercase) → "makefile"', () => {
            expect(service.detectLanguage('makefile')).toBe('makefile');
        });

        it('file with no extension → "plaintext"', () => {
            expect(service.detectLanguage('somefile')).toBe('plaintext');
        });

        it('unknown extension → "plaintext"', () => {
            expect(service.detectLanguage('file.xyz')).toBe('plaintext');
        });

        it('empty string → "plaintext"', () => {
            expect(service.detectLanguage('')).toBe('plaintext');
        });

        it('"untitled" → "plaintext"', () => {
            expect(service.detectLanguage('untitled')).toBe('plaintext');
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // highlightLine()
    // ─────────────────────────────────────────────────────────────────────────
    describe('highlightLine()', () => {
        it('returns input unchanged for language="plaintext"', () => {
            const text = 'const x = 1;';
            expect(service.highlightLine(text, 'plaintext')).toBe(text);
        });

        it('returns empty string unchanged for language="plaintext"', () => {
            expect(service.highlightLine('', 'plaintext')).toBe('');
        });

        it('returns a string (fallback or highlighted) for non-plaintext language', () => {
            // Prism may or may not be loaded in the Karma environment.
            // The method must always return a non-empty string — never throw.
            const text = 'const x = 1;';
            const result = service.highlightLine(text, 'typescript');
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        });

        it('returns input unchanged for empty string with non-plaintext language', () => {
            // Empty string → falsy guard, returns early
            expect(service.highlightLine('', 'typescript')).toBe('');
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // loadLanguage()
    // ─────────────────────────────────────────────────────────────────────────
    describe('loadLanguage()', () => {
        it('does not throw for "plaintext" (early return)', async () => {
            await expectAsync(service.loadLanguage('plaintext')).toBeResolved();
        });

        it('does not throw for a known language even if prism import fails', async () => {
            // In test environment, dynamic prism imports may fail silently
            await expectAsync(service.loadLanguage('typescript')).toBeResolved();
        });

        it('calling loadLanguage twice with same language does not throw', async () => {
            await service.loadLanguage('javascript');
            await expectAsync(service.loadLanguage('javascript')).toBeResolved();
        });
    });
});
