export function createMonacoEditorOptions(theme: string, language: string, overrides: Record<string, unknown> = {}) {
    return {
        theme,
        language,
        automaticLayout: true,
        fontSize: 14,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        ...overrides
    };
}
