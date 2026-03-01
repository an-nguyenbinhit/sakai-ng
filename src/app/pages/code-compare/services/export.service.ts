import { Injectable } from '@angular/core';
import { DiffResult, FileContent, DiffOptions, ViewMode } from '../models/diff.models';

@Injectable({ providedIn: 'root' })
export class ExportService {
    exportHtml(result: DiffResult, leftFile: FileContent, rightFile: FileContent, viewMode: ViewMode, options: DiffOptions): void {
        const html =
            viewMode === 'inline'
                ? this.buildInlineHtmlExport(result, leftFile, rightFile, options)
                : this.buildSideBySideHtmlExport(result, leftFile, rightFile, options);
        this.downloadFile(`diff-${Date.now()}.html`, html, 'text/html;charset=utf-8');
    }

    exportImage(result: DiffResult, leftFile: FileContent, rightFile: FileContent, viewMode: ViewMode, options: DiffOptions): Promise<void> {
        return viewMode === 'inline'
            ? this.renderInlineCanvas(result, leftFile, rightFile, options)
            : this.renderSideBySideCanvas(result, leftFile, rightFile, options);
    }

    // ─── Side-by-side image ───────────────────────────────────────────────────

    private renderSideBySideCanvas(result: DiffResult, leftFile: FileContent, rightFile: FileContent, options: DiffOptions): Promise<void> {
        return new Promise((resolve, reject) => {
            const fontSize = 14;
            const lineHeight = 22;
            const numColWidth = 52;
            const padding = 8;
            const headerHeight = 60;

            const rows = result.sideBySideRows;
            const monoFont = `${fontSize}px "Courier New", Consolas, monospace`;
            const uiFont = (size: number, bold = false) => `${bold ? 'bold ' : ''}${size}px system-ui, -apple-system, sans-serif`;

            const measureCanvas = document.createElement('canvas');
            const mCtx = measureCanvas.getContext('2d')!;
            mCtx.font = monoFont;

            let maxTextWidth = 300;
            rows.forEach(row => {
                if (row.left.type !== 'fold') {
                    maxTextWidth = Math.max(maxTextWidth, mCtx.measureText(this.unescapeHtml(row.left.raw ?? '')).width);
                    maxTextWidth = Math.max(maxTextWidth, mCtx.measureText(this.unescapeHtml(row.right.raw ?? '')).width);
                }
            });

            const halfWidth = Math.max(500, Math.min(maxTextWidth + padding * 2 + 16, 1600));
            const canvasWidth = numColWidth * 2 + halfWidth * 2;
            const maxContentWidth = halfWidth - padding * 2;

            interface Segment {
                text: string;
                highlight?: 'added' | 'removed';
            }

            const wrapToSegments = (tokens: { text: string; type: string }[] | null, raw: string, maxW: number): Segment[][] => {
                const allLines: Segment[][] = [];
                let lineSegs: Segment[] = [];
                let lineW = 0;

                const addChar = (ch: string, hl: 'added' | 'removed' | undefined) => {
                    const chW = mCtx.measureText(ch).width;
                    if (lineW > 0 && lineW + chW > maxW) {
                        allLines.push(lineSegs);
                        lineSegs = [];
                        lineW = 0;
                    }
                    const last = lineSegs[lineSegs.length - 1];
                    if (last && last.highlight === hl) {
                        last.text += ch;
                    } else {
                        lineSegs.push({ text: ch, highlight: hl });
                    }
                    lineW += chW;
                };

                if (tokens && tokens.length > 0) {
                    for (const tok of tokens) {
                        const hl: 'added' | 'removed' | undefined =
                            tok.type === 'added' ? 'added' : tok.type === 'removed' ? 'removed' : undefined;
                        for (const ch of this.unescapeHtml(tok.text)) addChar(ch, hl);
                    }
                } else {
                    for (const ch of this.unescapeHtml(raw ?? '')) addChar(ch, undefined);
                }

                if (lineSegs.length > 0 || allLines.length === 0) allLines.push(lineSegs);
                return allLines;
            };

            interface VisualRow {
                isFold: boolean;
                foldCount?: number;
                leftSegs: Segment[][];
                rightSegs: Segment[][];
                leftType: string;
                rightType: string;
                leftNum: number | null;
                rightNum: number | null;
                lineCount: number;
            }

            const visualRows: VisualRow[] = rows.map(row => {
                if (row.left.type === 'fold') {
                    return {
                        isFold: true,
                        foldCount: row.left.foldedCount,
                        leftSegs: [],
                        rightSegs: [],
                        leftType: 'fold',
                        rightType: 'fold',
                        leftNum: null,
                        rightNum: null,
                        lineCount: 1
                    };
                }
                const leftSegs = wrapToSegments(row.left.tokens, row.left.raw ?? '', maxContentWidth);
                const rightSegs = wrapToSegments(row.right.tokens, row.right.raw ?? '', maxContentWidth);
                return {
                    isFold: false,
                    leftSegs,
                    rightSegs,
                    leftType: row.left.type,
                    rightType: row.right.type,
                    leftNum: row.left.lineNumber,
                    rightNum: row.right.lineNumber,
                    lineCount: Math.max(leftSegs.length, rightSegs.length)
                };
            });

            const totalVisualLines = visualRows.reduce((sum, vr) => sum + vr.lineCount, 0);
            const rawH = headerHeight + totalVisualLines * lineHeight + 4;
            const MAX_DIM = 65535;
            const MAX_AREA = 268_435_456;
            const scale = rawH * 2 <= MAX_DIM && canvasWidth * 2 * rawH * 2 <= MAX_AREA ? 2 : 1;

            if (rawH > MAX_DIM || canvasWidth * rawH > MAX_AREA) {
                reject(new Error('Diff is too large to export as image. Try exporting as HTML instead.'));
                return;
            }

            const canvas = document.createElement('canvas');
            canvas.width = canvasWidth * scale;
            canvas.height = rawH * scale;

            const ctx = canvas.getContext('2d')!;
            if (!ctx) {
                reject(new Error('Canvas 2D context not available'));
                return;
            }
            ctx.scale(scale, scale);

            // White background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvasWidth, rawH);

            // Header: file names
            ctx.fillStyle = '#f8f9fa';
            ctx.fillRect(0, 0, canvasWidth, 36);
            ctx.fillStyle = '#212529';
            ctx.font = uiFont(14, true);
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'left';
            ctx.fillText(`${leftFile.name}  ↔  ${rightFile.name}`, 12, 18);

            // View mode + active options label (right-aligned)
            const optLabel = this.getActiveOptionsSummary(options);
            const modeText = `Side-by-side${optLabel ? '  •  ' + optLabel : ''}`;
            ctx.font = uiFont(11);
            ctx.fillStyle = '#6c757d';
            ctx.textAlign = 'right';
            ctx.fillText(modeText, canvasWidth - 12, 18);
            ctx.textAlign = 'left';

            // Stats row
            ctx.fillStyle = '#fcfcfc';
            ctx.fillRect(0, 36, canvasWidth, 20);
            ctx.font = uiFont(12);
            ctx.textBaseline = 'middle';

            const drawBadge = (text: string, fg: string, bg: string, x: number): number => {
                const w = ctx.measureText(text).width + 14;
                ctx.fillStyle = bg;
                ctx.fillRect(x, 40, w, 14);
                ctx.fillStyle = fg;
                ctx.fillText(text, x + 7, 47);
                return x + w + 8;
            };

            let sx = 12;
            sx = drawBadge(`+${result.totalAdded} added`, '#155724', '#d4edda', sx);
            sx = drawBadge(`-${result.totalRemoved} removed`, '#721c24', '#f8d7da', sx);
            sx = drawBadge(`~${result.totalModified} modified`, '#856404', '#fff3cd', sx);
            drawBadge(`${result.similarityPercent}% similar`, '#444444', '#e9ecef', sx);

            // Separator
            ctx.fillStyle = '#dee2e6';
            ctx.fillRect(0, 55, canvasWidth, 1);

            let currentY = headerHeight;

            visualRows.forEach(vr => {
                const rowH = vr.lineCount * lineHeight;
                const y = currentY;

                if (vr.isFold) {
                    ctx.fillStyle = '#e9ecef';
                    ctx.fillRect(0, y, canvasWidth, lineHeight);
                    ctx.fillStyle = '#868e96';
                    ctx.font = `italic ${fontSize - 1}px system-ui, sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(`··· ${vr.foldCount ?? 0} unchanged lines ···`, canvasWidth / 2, y + lineHeight / 2);
                    ctx.textAlign = 'left';
                    currentY += lineHeight;
                    return;
                }

                const drawSide = (lineNum: number | null, segLines: Segment[][], type: string, offsetX: number): void => {
                    ctx.fillStyle = '#f8f9fa';
                    ctx.fillRect(offsetX, y, numColWidth, rowH);
                    if (lineNum != null) {
                        ctx.fillStyle = '#adb5bd';
                        ctx.font = monoFont;
                        ctx.textAlign = 'right';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(String(lineNum), offsetX + numColWidth - 6, y + lineHeight / 2);
                    }

                    const bg = this.getBgColor(type);
                    ctx.fillStyle = bg === 'transparent' ? '#ffffff' : bg;
                    ctx.fillRect(offsetX + numColWidth, y, halfWidth, rowH);

                    ctx.font = monoFont;
                    ctx.textBaseline = 'middle';
                    ctx.textAlign = 'left';

                    segLines.forEach((segs, li) => {
                        let segX = offsetX + numColWidth + padding;
                        const sy = y + li * lineHeight + lineHeight / 2;
                        segs.forEach(seg => {
                            const segW = mCtx.measureText(seg.text).width;
                            if (seg.highlight === 'added') {
                                ctx.fillStyle = '#acf2bd';
                                ctx.fillRect(segX, sy - lineHeight / 2 + 2, segW, lineHeight - 4);
                            } else if (seg.highlight === 'removed') {
                                ctx.fillStyle = '#fdb8c0';
                                ctx.fillRect(segX, sy - lineHeight / 2 + 2, segW, lineHeight - 4);
                            }
                            ctx.fillStyle = '#212529';
                            ctx.fillText(seg.text, segX, sy);
                            segX += segW;
                        });
                    });
                };

                drawSide(vr.leftNum, vr.leftSegs, vr.leftType, 0);
                drawSide(vr.rightNum, vr.rightSegs, vr.rightType, numColWidth + halfWidth);

                ctx.fillStyle = '#f0f0f0';
                ctx.fillRect(0, y + rowH - 1, canvasWidth, 1);

                ctx.fillStyle = '#dee2e6';
                ctx.fillRect(numColWidth + halfWidth - 1, y, 2, rowH);

                currentY += rowH;
            });

            canvas.toBlob(blob => {
                if (!blob) {
                    reject(new Error('Failed to generate image blob'));
                    return;
                }
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `diff-${Date.now()}.png`;
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(url), 1000);
                resolve();
            }, 'image/png');
        });
    }

    // ─── Inline image ─────────────────────────────────────────────────────────

    private renderInlineCanvas(result: DiffResult, leftFile: FileContent, rightFile: FileContent, options: DiffOptions): Promise<void> {
        return new Promise((resolve, reject) => {
            const fontSize = 14;
            const lineHeight = 22;
            const numColWidth = 52;
            const markerWidth = 24;
            const padding = 8;
            const headerHeight = 60;

            const rows = result.inlineRows;
            const monoFont = `${fontSize}px "Courier New", Consolas, monospace`;
            const uiFont = (size: number, bold = false) => `${bold ? 'bold ' : ''}${size}px system-ui, -apple-system, sans-serif`;

            const measureCanvas = document.createElement('canvas');
            const mCtx = measureCanvas.getContext('2d')!;
            mCtx.font = monoFont;

            let maxTextWidth = 400;
            rows.forEach(row => {
                if (row.type !== 'fold') {
                    maxTextWidth = Math.max(maxTextWidth, mCtx.measureText(this.unescapeHtml(row.raw ?? '')).width);
                }
            });

            const contentWidth = Math.max(600, Math.min(maxTextWidth + padding * 2 + 16, 1800));
            const canvasWidth = numColWidth + markerWidth + contentWidth;
            const maxContentWidth = contentWidth - padding * 2;

            interface Segment {
                text: string;
                highlight?: 'added' | 'removed';
            }

            const wrapToSegments = (tokens: { text: string; type: string }[] | null, raw: string, maxW: number): Segment[][] => {
                const allLines: Segment[][] = [];
                let lineSegs: Segment[] = [];
                let lineW = 0;

                const addChar = (ch: string, hl: 'added' | 'removed' | undefined) => {
                    const chW = mCtx.measureText(ch).width;
                    if (lineW > 0 && lineW + chW > maxW) {
                        allLines.push(lineSegs);
                        lineSegs = [];
                        lineW = 0;
                    }
                    const last = lineSegs[lineSegs.length - 1];
                    if (last && last.highlight === hl) {
                        last.text += ch;
                    } else {
                        lineSegs.push({ text: ch, highlight: hl });
                    }
                    lineW += chW;
                };

                if (tokens && tokens.length > 0) {
                    for (const tok of tokens) {
                        const hl: 'added' | 'removed' | undefined =
                            tok.type === 'added' ? 'added' : tok.type === 'removed' ? 'removed' : undefined;
                        for (const ch of this.unescapeHtml(tok.text)) addChar(ch, hl);
                    }
                } else {
                    for (const ch of this.unescapeHtml(raw ?? '')) addChar(ch, undefined);
                }

                if (lineSegs.length > 0 || allLines.length === 0) allLines.push(lineSegs);
                return allLines;
            };

            interface VisualInlineRow {
                isFold: boolean;
                foldCount?: number;
                segs: Segment[][];
                type: string;
                lineNum: number | null;
                marker: string;
                lineCount: number;
            }

            const visualRows: VisualInlineRow[] = rows.map(row => {
                if (row.type === 'fold') {
                    return { isFold: true, foldCount: row.foldedCount, segs: [], type: 'fold', lineNum: null, marker: '', lineCount: 1 };
                }
                const segs = wrapToSegments(row.tokens, row.raw ?? '', maxContentWidth);
                const marker = row.type === 'added' ? '+' : row.type === 'removed' ? '-' : row.type === 'modified' ? '~' : ' ';
                return { isFold: false, segs, type: row.type, lineNum: row.lineNumber, marker, lineCount: segs.length };
            });

            const totalVisualLines = visualRows.reduce((sum, vr) => sum + vr.lineCount, 0);
            const rawH = headerHeight + totalVisualLines * lineHeight + 4;
            const MAX_DIM = 65535;
            const MAX_AREA = 268_435_456;
            const scale = rawH * 2 <= MAX_DIM && canvasWidth * 2 * rawH * 2 <= MAX_AREA ? 2 : 1;

            if (rawH > MAX_DIM || canvasWidth * rawH > MAX_AREA) {
                reject(new Error('Diff is too large to export as image. Try exporting as HTML instead.'));
                return;
            }

            const canvas = document.createElement('canvas');
            canvas.width = canvasWidth * scale;
            canvas.height = rawH * scale;

            const ctx = canvas.getContext('2d')!;
            if (!ctx) {
                reject(new Error('Canvas 2D context not available'));
                return;
            }
            ctx.scale(scale, scale);

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvasWidth, rawH);

            // Header: file names
            ctx.fillStyle = '#f8f9fa';
            ctx.fillRect(0, 0, canvasWidth, 36);
            ctx.fillStyle = '#212529';
            ctx.font = uiFont(14, true);
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'left';
            ctx.fillText(`${leftFile.name}  ↔  ${rightFile.name}`, 12, 18);

            // View mode + active options label (right-aligned)
            const optLabel = this.getActiveOptionsSummary(options);
            const modeText = `Inline${optLabel ? '  •  ' + optLabel : ''}`;
            ctx.font = uiFont(11);
            ctx.fillStyle = '#6c757d';
            ctx.textAlign = 'right';
            ctx.fillText(modeText, canvasWidth - 12, 18);
            ctx.textAlign = 'left';

            // Stats row
            ctx.fillStyle = '#fcfcfc';
            ctx.fillRect(0, 36, canvasWidth, 20);
            ctx.font = uiFont(12);
            ctx.textBaseline = 'middle';

            const drawBadge = (text: string, fg: string, bg: string, x: number): number => {
                const w = ctx.measureText(text).width + 14;
                ctx.fillStyle = bg;
                ctx.fillRect(x, 40, w, 14);
                ctx.fillStyle = fg;
                ctx.fillText(text, x + 7, 47);
                return x + w + 8;
            };

            let sx = 12;
            sx = drawBadge(`+${result.totalAdded} added`, '#155724', '#d4edda', sx);
            sx = drawBadge(`-${result.totalRemoved} removed`, '#721c24', '#f8d7da', sx);
            sx = drawBadge(`~${result.totalModified} modified`, '#856404', '#fff3cd', sx);
            drawBadge(`${result.similarityPercent}% similar`, '#444444', '#e9ecef', sx);

            ctx.fillStyle = '#dee2e6';
            ctx.fillRect(0, 55, canvasWidth, 1);

            let currentY = headerHeight;

            visualRows.forEach(vr => {
                const rowH = vr.lineCount * lineHeight;
                const y = currentY;

                if (vr.isFold) {
                    ctx.fillStyle = '#e9ecef';
                    ctx.fillRect(0, y, canvasWidth, lineHeight);
                    ctx.fillStyle = '#868e96';
                    ctx.font = `italic ${fontSize - 1}px system-ui, sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(`··· ${vr.foldCount ?? 0} unchanged lines ···`, canvasWidth / 2, y + lineHeight / 2);
                    ctx.textAlign = 'left';
                    currentY += lineHeight;
                    return;
                }

                // Gutter (line number)
                ctx.fillStyle = this.getGutterBgColor(vr.type);
                ctx.fillRect(0, y, numColWidth, rowH);
                if (vr.lineNum != null) {
                    ctx.fillStyle = '#adb5bd';
                    ctx.font = monoFont;
                    ctx.textAlign = 'right';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(String(vr.lineNum), numColWidth - 6, y + lineHeight / 2);
                }

                // Marker column
                ctx.fillStyle = this.getGutterBgColor(vr.type);
                ctx.fillRect(numColWidth, y, markerWidth, rowH);
                if (vr.marker.trim()) {
                    ctx.fillStyle = this.getMarkerColor(vr.type);
                    ctx.font = uiFont(13, true);
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(vr.marker, numColWidth + markerWidth / 2, y + lineHeight / 2);
                }

                // Content area
                const bg = this.getBgColor(vr.type);
                ctx.fillStyle = bg === 'transparent' ? '#ffffff' : bg;
                ctx.fillRect(numColWidth + markerWidth, y, contentWidth, rowH);

                ctx.font = monoFont;
                ctx.textBaseline = 'middle';
                ctx.textAlign = 'left';

                vr.segs.forEach((segs, li) => {
                    let segX = numColWidth + markerWidth + padding;
                    const sy = y + li * lineHeight + lineHeight / 2;
                    segs.forEach(seg => {
                        const segW = mCtx.measureText(seg.text).width;
                        if (seg.highlight === 'added') {
                            ctx.fillStyle = '#acf2bd';
                            ctx.fillRect(segX, sy - lineHeight / 2 + 2, segW, lineHeight - 4);
                        } else if (seg.highlight === 'removed') {
                            ctx.fillStyle = '#fdb8c0';
                            ctx.fillRect(segX, sy - lineHeight / 2 + 2, segW, lineHeight - 4);
                        }
                        ctx.fillStyle = '#212529';
                        ctx.fillText(seg.text, segX, sy);
                        segX += segW;
                    });
                });

                // Row separator
                ctx.fillStyle = '#f0f0f0';
                ctx.fillRect(0, y + rowH - 1, canvasWidth, 1);

                // Column dividers
                ctx.fillStyle = '#dee2e6';
                ctx.fillRect(numColWidth, y, 1, rowH);
                ctx.fillRect(numColWidth + markerWidth, y, 1, rowH);

                currentY += rowH;
            });

            canvas.toBlob(blob => {
                if (!blob) {
                    reject(new Error('Failed to generate image blob'));
                    return;
                }
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `diff-${Date.now()}.png`;
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(url), 1000);
                resolve();
            }, 'image/png');
        });
    }

    // ─── Side-by-side HTML ────────────────────────────────────────────────────

    private buildSideBySideHtmlExport(result: DiffResult, leftFile: FileContent, rightFile: FileContent, options: DiffOptions): string {
        const rows = result.sideBySideRows
            .map(row => {
                if (row.left.type === 'fold') {
                    const count = row.left.foldedCount ?? 0;
                    return `<tr style="background:#e8e8e8"><td colspan="4" style="padding:4px 8px;text-align:center;color:#666;font-style:italic">... ${count} unchanged lines ...</td></tr>`;
                }

                const leftBg = this.getBgColor(row.left.type);
                const rightBg = this.getBgColor(row.right.type);
                const leftNum = row.left.lineNumber ?? '';
                const rightNum = row.right.lineNumber ?? '';
                const leftContent = this.renderTokensOrRaw(row.left);
                const rightContent = this.renderTokensOrRaw(row.right);

                return `<tr>
  <td style="width:40px;text-align:right;padding:2px 8px;color:#999;background:#f5f5f5;border-right:1px solid #ddd;user-select:none;white-space:nowrap">${leftNum}</td>
  <td style="background:${leftBg === 'transparent' ? 'transparent' : leftBg};padding:2px 8px;font-family:monospace;white-space:pre-wrap;word-break:break-all;overflow-wrap:break-word">${leftContent}</td>
  <td style="width:40px;text-align:right;padding:2px 8px;color:#999;background:#f5f5f5;border-left:1px solid #ddd;border-right:1px solid #ddd;user-select:none;white-space:nowrap">${rightNum}</td>
  <td style="background:${rightBg === 'transparent' ? 'transparent' : rightBg};padding:2px 8px;font-family:monospace;white-space:pre-wrap;word-break:break-all;overflow-wrap:break-word">${rightContent}</td>
</tr>`;
            })
            .join('\n');

        const optLabel = this.getActiveOptionsSummary(options);

        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Diff: ${this.escapeHtml(leftFile.name)} vs ${this.escapeHtml(rightFile.name)}</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 0; padding: 16px; background: #fff; }
  h1 { font-size: 1.1rem; color: #333; margin-bottom: 4px; }
  .meta { font-size: 0.8rem; color: #888; margin-bottom: 8px; }
  .summary { display: flex; gap: 16px; margin-bottom: 16px; font-size: 0.9rem; }
  .added { color: #155724; background: #d4edda; padding: 2px 8px; border-radius: 4px; }
  .removed { color: #721c24; background: #f8d7da; padding: 2px 8px; border-radius: 4px; }
  .modified { color: #856404; background: #fff3cd; padding: 2px 8px; border-radius: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; table-layout: fixed; }
  td { border-bottom: 1px solid #f0f0f0; vertical-align: top; }
  .mark-add { background: #acf2bd; }
  .mark-del { background: #fdb8c0; }
</style>
</head>
<body>
<h1>Diff: <code>${this.escapeHtml(leftFile.name)}</code> vs <code>${this.escapeHtml(rightFile.name)}</code></h1>
<div class="meta">Side-by-side view${optLabel ? ' &nbsp;•&nbsp; ' + this.escapeHtml(optLabel) : ''}</div>
<div class="summary">
  <span class="added">+${result.totalAdded} added</span>
  <span class="removed">-${result.totalRemoved} removed</span>
  <span class="modified">~${result.totalModified} modified</span>
  <span>${result.similarityPercent}% similar</span>
</div>
<table>
<thead>
  <tr style="background:#f5f5f5;font-weight:bold">
    <th style="width:40px"></th>
    <th style="padding:4px 8px;text-align:left">${this.escapeHtml(leftFile.name)}</th>
    <th style="width:40px"></th>
    <th style="padding:4px 8px;text-align:left">${this.escapeHtml(rightFile.name)}</th>
  </tr>
</thead>
<tbody>
${rows}
</tbody>
</table>
</body>
</html>`;
    }

    // ─── Inline HTML ──────────────────────────────────────────────────────────

    private buildInlineHtmlExport(result: DiffResult, leftFile: FileContent, rightFile: FileContent, options: DiffOptions): string {
        const rows = result.inlineRows
            .map(row => {
                if (row.type === 'fold') {
                    return `<tr style="background:#e8e8e8"><td colspan="3" style="padding:4px 8px;text-align:center;color:#666;font-style:italic">... ${row.foldedCount ?? 0} unchanged lines ...</td></tr>`;
                }

                const bg = this.getBgColor(row.type);
                const lineNum = row.lineNumber ?? '';
                const content = this.renderTokensOrRaw(row);
                const marker = row.type === 'added' ? '+' : row.type === 'removed' ? '-' : row.type === 'modified' ? '~' : '';
                const markerColor =
                    row.type === 'added' ? '#155724' : row.type === 'removed' ? '#721c24' : row.type === 'modified' ? '#856404' : '#999';

                return `<tr>
  <td style="width:40px;text-align:right;padding:2px 8px;color:#999;background:#f5f5f5;border-right:1px solid #ddd;user-select:none;white-space:nowrap">${lineNum}</td>
  <td style="width:20px;text-align:center;padding:2px 4px;color:${markerColor};background:#f5f5f5;border-right:1px solid #ddd;user-select:none;font-weight:bold">${marker}</td>
  <td style="background:${bg === 'transparent' ? 'transparent' : bg};padding:2px 8px;font-family:monospace;white-space:pre-wrap;word-break:break-all;overflow-wrap:break-word">${content}</td>
</tr>`;
            })
            .join('\n');

        const optLabel = this.getActiveOptionsSummary(options);

        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Diff: ${this.escapeHtml(leftFile.name)} vs ${this.escapeHtml(rightFile.name)}</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 0; padding: 16px; background: #fff; }
  h1 { font-size: 1.1rem; color: #333; margin-bottom: 4px; }
  .meta { font-size: 0.8rem; color: #888; margin-bottom: 8px; }
  .summary { display: flex; gap: 16px; margin-bottom: 16px; font-size: 0.9rem; }
  .added { color: #155724; background: #d4edda; padding: 2px 8px; border-radius: 4px; }
  .removed { color: #721c24; background: #f8d7da; padding: 2px 8px; border-radius: 4px; }
  .modified { color: #856404; background: #fff3cd; padding: 2px 8px; border-radius: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; table-layout: fixed; }
  td { border-bottom: 1px solid #f0f0f0; vertical-align: top; }
  .mark-add { background: #acf2bd; }
  .mark-del { background: #fdb8c0; }
</style>
</head>
<body>
<h1>Diff: <code>${this.escapeHtml(leftFile.name)}</code> vs <code>${this.escapeHtml(rightFile.name)}</code></h1>
<div class="meta">Inline view${optLabel ? ' &nbsp;•&nbsp; ' + this.escapeHtml(optLabel) : ''}</div>
<div class="summary">
  <span class="added">+${result.totalAdded} added</span>
  <span class="removed">-${result.totalRemoved} removed</span>
  <span class="modified">~${result.totalModified} modified</span>
  <span>${result.similarityPercent}% similar</span>
</div>
<table>
<thead>
  <tr style="background:#f5f5f5;font-weight:bold">
    <th style="width:40px"></th>
    <th style="width:20px"></th>
    <th style="padding:4px 8px;text-align:left">${this.escapeHtml(leftFile.name)} &nbsp;↔&nbsp; ${this.escapeHtml(rightFile.name)}</th>
  </tr>
</thead>
<tbody>
${rows}
</tbody>
</table>
</body>
</html>`;
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private getActiveOptionsSummary(options: DiffOptions): string {
        const parts: string[] = [];
        if (options.ignoreWhitespace) parts.push('Ignore whitespace');
        if (options.ignoreCase) parts.push('Ignore case');
        if (options.ignoreBlankLines) parts.push('Ignore blank lines');
        if (options.ignoreComments) parts.push('Ignore comments');
        if (options.trimLines) parts.push('Trim lines');
        return parts.join(' • ');
    }

    private getBgColor(type: string): string {
        switch (type) {
            case 'added':
                return '#d4edda';
            case 'removed':
                return '#f8d7da';
            case 'modified':
                return '#fff3cd';
            default:
                return 'transparent';
        }
    }

    private getGutterBgColor(type: string): string {
        switch (type) {
            case 'added':
                return '#c3e6cb';
            case 'removed':
                return '#f5c6cb';
            case 'modified':
                return '#ffeeba';
            default:
                return '#f8f9fa';
        }
    }

    private getMarkerColor(type: string): string {
        switch (type) {
            case 'added':
                return '#155724';
            case 'removed':
                return '#721c24';
            case 'modified':
                return '#856404';
            default:
                return '#999999';
        }
    }

    private renderTokensOrRaw(line: { tokens: any[] | null; raw: string; highlightedHtml: string }): string {
        if (line.tokens && line.tokens.length > 0) {
            return line.tokens
                .map(t => {
                    if (t.type === 'added') return `<span class="mark-add">${t.text}</span>`;
                    if (t.type === 'removed') return `<span class="mark-del">${t.text}</span>`;
                    return t.text;
                })
                .join('');
        }
        return line.highlightedHtml || line.raw || '&nbsp;';
    }

    private downloadFile(filename: string, content: string, mimeType: string): void {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    private escapeHtml(text: string): string {
        return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
