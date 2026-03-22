import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TextUtilsService {
    toUpperCase(input: string) {
        return input.toUpperCase();
    }

    toLowerCase(input: string) {
        return input.toLowerCase();
    }

    toTitleCase(input: string) {
        return input.replace(/\w\S*/g, (chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1).toLowerCase());
    }

    trimLines(input: string) {
        return input
            .split(/\r?\n/)
            .map((line) => line.trim())
            .join('\n');
    }

    dedupeLines(input: string) {
        const lines = input.split(/\r?\n/);
        return Array.from(new Set(lines)).join('\n');
    }

    sortLines(input: string, direction: 'asc' | 'desc' = 'asc') {
        const sorted = input.split(/\r?\n/).sort((a, b) => a.localeCompare(b));
        return (direction === 'desc' ? sorted.reverse() : sorted).join('\n');
    }

    removeBlankLines(input: string) {
        return input
            .split(/\r?\n/)
            .filter((line) => line.trim().length)
            .join('\n');
    }

    slugify(input: string) {
        return input
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
    }
}
