import { Injectable } from '@angular/core';

export type ValidationSeverity = 'error' | 'warning' | 'info';
export type ValidationSegment = 'ownerCode' | 'equipmentCategory' | 'serialNumber' | 'checkDigit' | 'format';

export interface ContainerNumberParts {
    ownerCode: string;
    equipmentCategory: string;
    serialNumber: string;
    checkDigit: string;
    normalized: string;
    compact: string;
}

export interface ValidationIssue {
    code: string;
    message: string;
    severity: ValidationSeverity;
    segment: ValidationSegment;
}

export interface WeightedStep {
    character: string;
    index: number;
    numericValue: number;
    weight: number;
    product: number;
}

export interface ContainerValidationResult {
    normalizedInput: string;
    isValid: boolean;
    expectedCheckDigit: number | null;
    parts: ContainerNumberParts;
    issues: ValidationIssue[];
    weightedSteps: WeightedStep[];
}

export interface BatchRowResult {
    raw: string;
    normalized: string;
    isValid: boolean;
    expectedCheckDigit: number | null;
    actualCheckDigit: number | null;
    summary: string;
}

export interface BatchValidationResult {
    rows: BatchRowResult[];
    total: number;
    validCount: number;
    invalidCount: number;
}

export interface SampleCase {
    label: string;
    input: string;
    description: string;
}

export type GeneratedContainerKind = 'valid' | 'invalid' | 'mixed';

const LETTER_VALUES = new Map<string, number>([
    ['A', 10],
    ['B', 12],
    ['C', 13],
    ['D', 14],
    ['E', 15],
    ['F', 16],
    ['G', 17],
    ['H', 18],
    ['I', 19],
    ['J', 20],
    ['K', 21],
    ['L', 23],
    ['M', 24],
    ['N', 25],
    ['O', 26],
    ['P', 27],
    ['Q', 28],
    ['R', 29],
    ['S', 30],
    ['T', 31],
    ['U', 32],
    ['V', 34],
    ['W', 35],
    ['X', 36],
    ['Y', 37],
    ['Z', 38]
]);

export const CONTAINER_CHECK_SAMPLES: SampleCase[] = [
    {
        label: 'Valid standard container',
        input: 'CSQU3054383',
        description: 'ISO 6346-style container number with a matching check digit.'
    },
    {
        label: 'Valid detachable equipment',
        input: 'MSCJ1234569',
        description: 'Structure is valid, but category J is detachable equipment rather than a standard freight container.'
    },
    {
        label: 'Valid chassis / trailer code',
        input: 'OOLZ7654323',
        description: 'Category Z is valid in the standard and commonly used for chassis and trailers.'
    },
    {
        label: 'Invalid check digit',
        input: 'CSQU3054381',
        description: 'All segments look valid, but the final check digit does not match the ISO calculation.'
    },
    {
        label: 'Missing check digit',
        input: 'CSQU305438',
        description: 'Ten characters only: owner, category, and serial are present but the check digit is missing.'
    },
    {
        label: 'Lowercase with separators',
        input: 'csqu-305438-3',
        description: 'Useful for showing normalization of lowercase input with separators.'
    },
    {
        label: 'OCR confusion',
        input: 'MSCU66O9878',
        description: 'The serial block contains O instead of 0, a common OCR or manual entry mistake.'
    },
    {
        label: 'Invalid equipment category',
        input: 'MSCX6639878',
        description: 'Fourth character must be U, J, or Z for ISO 6346 identification.'
    }
];

@Injectable({ providedIn: 'root' })
export class ContainerCheckService {
    readonly samples = CONTAINER_CHECK_SAMPLES;
    private readonly ownerAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    private readonly categories = ['U', 'J', 'Z'] as const;

    normalize(input: string): string {
        return input.toUpperCase().replace(/[\s-]+/g, '');
    }

    parse(input: string): ContainerNumberParts {
        const normalized = this.normalize(input);

        return {
            ownerCode: normalized.slice(0, 3),
            equipmentCategory: normalized.slice(3, 4),
            serialNumber: normalized.slice(4, 10),
            checkDigit: normalized.slice(10, 11),
            normalized,
            compact: normalized
        };
    }

    calculateCheckDigit(ownerAndSerial: string): number {
        const normalized = this.normalize(ownerAndSerial);
        if (!/^[A-Z]{4}\d{6}$/.test(normalized)) {
            throw new Error('Check digit calculation requires exactly 4 letters followed by 6 digits.');
        }

        const remainder = this.sumWeightedCharacters(normalized) % 11;
        return remainder === 10 ? 0 : remainder;
    }

    getWeightedSteps(ownerAndSerial: string): WeightedStep[] {
        const normalized = this.normalize(ownerAndSerial);
        if (!/^[A-Z]{4}\d{6}$/.test(normalized)) {
            return [];
        }

        return this.buildWeightedSteps(normalized);
    }

    validate(input: string): ContainerValidationResult {
        const parts = this.parse(input);
        const issues: ValidationIssue[] = [];
        const normalized = parts.normalized;

        if (!normalized) {
            issues.push({
                code: 'empty-input',
                message: 'Enter a container number before running validation.',
                severity: 'error',
                segment: 'format'
            });
        }

        if (normalized.length < 11) {
            issues.push({
                code: normalized.length === 10 ? 'missing-check-digit' : 'short-input',
                message: normalized.length === 10 ? 'The check digit is missing. ISO 6346 container numbers must be 11 characters long.' : 'Container numbers must normalize to 11 characters.',
                severity: 'error',
                segment: 'format'
            });
        } else if (normalized.length > 11) {
            issues.push({
                code: 'long-input',
                message: 'Container numbers must normalize to exactly 11 characters.',
                severity: 'error',
                segment: 'format'
            });
        }

        if (parts.ownerCode && !/^[A-Z]{3}$/.test(parts.ownerCode)) {
            issues.push({
                code: 'invalid-owner-code',
                message: 'Owner code must contain exactly 3 letters.',
                severity: 'error',
                segment: 'ownerCode'
            });
        }

        if (parts.equipmentCategory) {
            if (!/^[A-Z]$/.test(parts.equipmentCategory)) {
                issues.push({
                    code: 'invalid-equipment-character',
                    message: 'Equipment category must be a single letter.',
                    severity: 'error',
                    segment: 'equipmentCategory'
                });
            } else if (!['U', 'J', 'Z'].includes(parts.equipmentCategory)) {
                issues.push({
                    code: 'invalid-equipment-category',
                    message: 'Equipment category must be U, J, or Z.',
                    severity: 'error',
                    segment: 'equipmentCategory'
                });
            } else if (parts.equipmentCategory === 'J' || parts.equipmentCategory === 'Z') {
                issues.push({
                    code: 'non-standard-freight-category',
                    message: `Category ${parts.equipmentCategory} is structurally valid, but it is not a standard freight container code.`,
                    severity: 'warning',
                    segment: 'equipmentCategory'
                });
            }
        }

        if (parts.serialNumber) {
            if (!/^\d{6}$/.test(parts.serialNumber)) {
                issues.push({
                    code: 'invalid-serial-number',
                    message: 'Serial number must contain exactly 6 digits.',
                    severity: 'error',
                    segment: 'serialNumber'
                });
            }

            if (/[OIQ]/.test(parts.serialNumber)) {
                issues.push({
                    code: 'serial-ocr-hint',
                    message: 'Serial number contains letters that often come from OCR confusion. Check O/0, I/1, and Q/0 carefully.',
                    severity: 'warning',
                    segment: 'serialNumber'
                });
            }
        }

        if (parts.checkDigit) {
            if (!/^\d$/.test(parts.checkDigit)) {
                issues.push({
                    code: 'invalid-check-digit-character',
                    message: 'Check digit must be a single digit from 0 to 9.',
                    severity: 'error',
                    segment: 'checkDigit'
                });
            }
        } else if (normalized.length >= 10) {
            issues.push({
                code: 'missing-check-digit-character',
                message: 'Check digit is required in the eleventh position.',
                severity: 'error',
                segment: 'checkDigit'
            });
        }

        const baseCode = normalized.slice(0, 10);
        const canCalculate = /^[A-Z]{4}\d{6}$/.test(baseCode);
        const expectedCheckDigit = canCalculate ? this.calculateCheckDigit(baseCode) : null;
        const weightedSteps = canCalculate ? this.buildWeightedSteps(baseCode) : [];

        if (expectedCheckDigit !== null && /^\d$/.test(parts.checkDigit) && Number(parts.checkDigit) !== expectedCheckDigit) {
            issues.push({
                code: 'check-digit-mismatch',
                message: `Check digit mismatch. Expected ${expectedCheckDigit}, received ${parts.checkDigit}.`,
                severity: 'error',
                segment: 'checkDigit'
            });
        }

        return {
            normalizedInput: normalized,
            isValid: issues.every((issue) => issue.severity !== 'error'),
            expectedCheckDigit,
            parts,
            issues,
            weightedSteps
        };
    }

    validateBatch(input: string): BatchValidationResult {
        const rows = input
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line.length > 0)
            .map((line) => {
                const result = this.validate(line);
                const firstError = result.issues.find((issue) => issue.severity === 'error');
                const firstWarning = result.issues.find((issue) => issue.severity === 'warning');

                return {
                    raw: line,
                    normalized: result.normalizedInput,
                    isValid: result.isValid,
                    expectedCheckDigit: result.expectedCheckDigit,
                    actualCheckDigit: /^\d$/.test(result.parts.checkDigit) ? Number(result.parts.checkDigit) : null,
                    summary: firstError?.message ?? firstWarning?.message ?? 'Valid container number'
                } satisfies BatchRowResult;
            });

        const validCount = rows.filter((row) => row.isValid).length;

        return {
            rows,
            total: rows.length,
            validCount,
            invalidCount: rows.length - validCount
        };
    }

    generateRandomList(count: number, kind: GeneratedContainerKind): string[] {
        const safeCount = Math.max(1, Math.min(500, Math.floor(count || 1)));

        return Array.from({ length: safeCount }, (_, index) => {
            if (kind === 'mixed') {
                return index % 2 === 0 ? this.generateRandomContainerNumber(true) : this.generateRandomContainerNumber(false);
            }

            return this.generateRandomContainerNumber(kind === 'valid');
        });
    }

    generateRandomContainerNumber(valid: boolean): string {
        const base = this.generateRandomBaseCode(valid);
        const validDigit = this.calculateCheckDigit(base);

        if (valid) {
            return `${base}${validDigit}`;
        }

        const invalidStrategy = Math.floor(Math.random() * 4);

        switch (invalidStrategy) {
            case 0:
                return `${base}${(validDigit + 1) % 10}`;
            case 1:
                return base;
            case 2:
                return `${base.slice(0, 3)}X${base.slice(4)}${validDigit}`;
            default:
                return `${base.slice(0, 7)}O${base.slice(8)}${validDigit}`;
        }
    }

    private buildWeightedSteps(baseCode: string): WeightedStep[] {
        return baseCode.split('').map((character, index) => {
            const numericValue = LETTER_VALUES.get(character) ?? Number(character);
            const weight = 2 ** index;

            return {
                character,
                index,
                numericValue,
                weight,
                product: numericValue * weight
            };
        });
    }

    private sumWeightedCharacters(baseCode: string): number {
        return this.buildWeightedSteps(baseCode).reduce((sum, step) => sum + step.product, 0);
    }

    private generateRandomBaseCode(standardContainerOnly: boolean): string {
        const ownerCode = Array.from({ length: 3 }, () => this.ownerAlphabet[Math.floor(Math.random() * this.ownerAlphabet.length)]).join('');
        const equipmentCategory = standardContainerOnly ? 'U' : this.categories[Math.floor(Math.random() * this.categories.length)];
        const serialNumber = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');

        return `${ownerCode}${equipmentCategory}${serialNumber}`;
    }
}
