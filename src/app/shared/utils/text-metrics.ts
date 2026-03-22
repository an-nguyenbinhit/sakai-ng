export interface TextMetrics {
    chars: number;
    words: number;
    lines: number;
    bytes: number;
}

export function calculateTextMetrics(text: string): TextMetrics {
    const normalized = text ?? '';
    const trimmed = normalized.trim();

    return {
        chars: normalized.length,
        words: trimmed ? trimmed.split(/\s+/).length : 0,
        lines: normalized ? normalized.split(/\r?\n/).length : 0,
        bytes: new Blob([normalized]).size
    };
}
