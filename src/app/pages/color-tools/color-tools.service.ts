import { Injectable } from '@angular/core';

export interface RgbColor {
    r: number;
    g: number;
    b: number;
}

export interface HslColor {
    h: number;
    s: number;
    l: number;
}

export interface OklchColor {
    l: number;
    c: number;
    h: number;
}

export interface ColorInspection {
    hex: string;
    rgb: RgbColor;
    hsl: HslColor;
    oklch: OklchColor;
    rgbString: string;
    hslString: string;
    oklchString: string;
    bestTextColor: string;
}

export interface ContrastResult {
    ratio: number;
    normalAA: boolean;
    normalAAA: boolean;
    largeAA: boolean;
    largeAAA: boolean;
}

export interface GradientStop {
    color: string;
    position: number;
}

export interface GradientResult {
    css: string;
    stops: GradientStop[];
}

@Injectable({ providedIn: 'root' })
export class ColorToolsService {
    normalizeHex(input: string): string {
        const trimmed = input.trim().replace(/^#/, '');
        if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(trimmed)) {
            throw new Error('Color must be a 3-digit or 6-digit HEX value.');
        }

        const normalized = trimmed.length === 3 ? trimmed.split('').map((char) => `${char}${char}`).join('') : trimmed;
        return `#${normalized.toLowerCase()}`;
    }

    hexToRgb(input: string): RgbColor {
        const hex = this.normalizeHex(input).slice(1);
        return {
            r: Number.parseInt(hex.slice(0, 2), 16),
            g: Number.parseInt(hex.slice(2, 4), 16),
            b: Number.parseInt(hex.slice(4, 6), 16)
        };
    }

    rgbToHex(rgb: RgbColor): string {
        const toHex = (value: number) => this.clamp(value, 0, 255).toString(16).padStart(2, '0');
        return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
    }

    rgbToHsl(rgb: RgbColor): HslColor {
        const r = rgb.r / 255;
        const g = rgb.g / 255;
        const b = rgb.b / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;

        let h = 0;
        const l = (max + min) / 2;
        const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

        if (delta !== 0) {
            if (max === r) {
                h = 60 * (((g - b) / delta) % 6);
            } else if (max === g) {
                h = 60 * ((b - r) / delta + 2);
            } else {
                h = 60 * ((r - g) / delta + 4);
            }
        }

        return {
            h: h < 0 ? h + 360 : h,
            s: s * 100,
            l: l * 100
        };
    }

    rgbToOklch(rgb: RgbColor): OklchColor {
        const srgbToLinear = (value: number) => {
            const channel = value / 255;
            return channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
        };

        const r = srgbToLinear(rgb.r);
        const g = srgbToLinear(rgb.g);
        const b = srgbToLinear(rgb.b);

        const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
        const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
        const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

        const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
        const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
        const bAxis = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

        const chroma = Math.sqrt(a * a + bAxis * bAxis);
        const hue = ((Math.atan2(bAxis, a) * 180) / Math.PI + 360) % 360;

        return {
            l: lightness * 100,
            c: chroma,
            h: hue
        };
    }

    inspectColor(input: string): ColorInspection {
        const hex = this.normalizeHex(input);
        const rgb = this.hexToRgb(hex);
        const hsl = this.rgbToHsl(rgb);
        const oklch = this.rgbToOklch(rgb);
        const blackContrast = this.getContrastRatio(hex, '#000000').ratio;
        const whiteContrast = this.getContrastRatio(hex, '#ffffff').ratio;

        return {
            hex,
            rgb,
            hsl,
            oklch,
            rgbString: `rgb(${rgb.r} ${rgb.g} ${rgb.b})`,
            hslString: `hsl(${Math.round(hsl.h)} ${Math.round(hsl.s)}% ${Math.round(hsl.l)}%)`,
            oklchString: `oklch(${oklch.l.toFixed(2)}% ${oklch.c.toFixed(4)} ${oklch.h.toFixed(2)})`,
            bestTextColor: blackContrast >= whiteContrast ? '#000000' : '#ffffff'
        };
    }

    getContrastRatio(foreground: string, background: string): ContrastResult {
        const fg = this.hexToRgb(foreground);
        const bg = this.hexToRgb(background);
        const ratio = this.calculateContrastRatio(fg, bg);

        return {
            ratio,
            normalAA: ratio >= 4.5,
            normalAAA: ratio >= 7,
            largeAA: ratio >= 3,
            largeAAA: ratio >= 4.5
        };
    }

    buildLinearGradient(start: string, end: string, angle: number, steps: number): GradientResult {
        const safeSteps = this.clamp(Math.round(steps), 2, 12);
        const startRgb = this.hexToRgb(start);
        const endRgb = this.hexToRgb(end);

        const stops: GradientStop[] = Array.from({ length: safeSteps }, (_, index) => {
            const factor = safeSteps === 1 ? 0 : index / (safeSteps - 1);
            const mixed = {
                r: Math.round(startRgb.r + (endRgb.r - startRgb.r) * factor),
                g: Math.round(startRgb.g + (endRgb.g - startRgb.g) * factor),
                b: Math.round(startRgb.b + (endRgb.b - startRgb.b) * factor)
            };

            return {
                color: this.rgbToHex(mixed),
                position: Math.round(factor * 100)
            };
        });

        return {
            css: `linear-gradient(${Math.round(angle)}deg, ${stops.map((stop) => `${stop.color} ${stop.position}%`).join(', ')})`,
            stops
        };
    }

    private calculateContrastRatio(foreground: RgbColor, background: RgbColor): number {
        const fgLuminance = this.relativeLuminance(foreground);
        const bgLuminance = this.relativeLuminance(background);
        const lighter = Math.max(fgLuminance, bgLuminance);
        const darker = Math.min(fgLuminance, bgLuminance);
        return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
    }

    private relativeLuminance(rgb: RgbColor): number {
        const toLinear = (value: number) => {
            const channel = value / 255;
            return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
        };

        const r = toLinear(rgb.r);
        const g = toLinear(rgb.g);
        const b = toLinear(rgb.b);

        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    private clamp(value: number, min: number, max: number): number {
        return Math.min(Math.max(value, min), max);
    }
}
