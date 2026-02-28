import { Injectable } from '@angular/core';
import { DiffResult, FileContent } from '../models/diff.models';

@Injectable({ providedIn: 'root' })
export class ExportService {
    exportHtml(result: DiffResult, leftFile: FileContent, rightFile: FileContent): void {
        const html = this.buildHtmlExport(result, leftFile, rightFile);
        this.downloadFile(`diff-${Date.now()}.html`, html, 'text/html;charset=utf-8');
    }

    exportPdf(result: DiffResult, leftFile: FileContent, rightFile: FileContent): void {
        const html = this.buildPdfExport(result, leftFile, rightFile);
        const win = window.open('', '_blank');
        if (!win) return;
        win.document.write(html);
        win.document.close();
        win.focus();
        // Give the browser time to render before triggering print
        setTimeout(() => {
            win.print();
            win.close();
        }, 400);
    }

    exportImage(result: DiffResult, leftFile: FileContent, rightFile: FileContent): void {
        const SCALE = 2; // High-DPI: render at 2x to prevent blurry text
        const fontSize = 14;
        const lineHeight = 22;
        const numColWidth = 52;
        const padding = 8;
        const headerHeight = 60;

        const rows = result.sideBySideRows;
        const monoFont = `${fontSize}px "Courier New", Consolas, monospace`;
        const uiFont = (size: number, bold = false) =>
            `${bold ? 'bold ' : ''}${size}px system-ui, -apple-system, sans-serif`;

        // Measure text widths with a temporary canvas
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

        // Dynamic half-width: fits longest line, min 500px, max 1600px per side
        const halfWidth = Math.max(500, Math.min(maxTextWidth + padding * 2 + 16, 1600));
        const canvasWidth = numColWidth * 2 + halfWidth * 2;
        const maxContentWidth = halfWidth - padding * 2;

        // Wrap text character-by-character so no squishing occurs
        const wrapText = (text: string, maxW: number): string[] => {
            if (!text) return [''];
            if (mCtx.measureText(text).width <= maxW) return [text];
            const lines: string[] = [];
            let line = '';
            for (const ch of text) {
                if (mCtx.measureText(line + ch).width > maxW) {
                    lines.push(line);
                    line = ch;
                } else {
                    line += ch;
                }
            }
            if (line) lines.push(line);
            return lines.length > 0 ? lines : [''];
        };

        // Pre-compute visual rows (each source row may expand to multiple visual lines)
        interface VisualRow {
            isFold: boolean;
            foldCount?: number;
            leftLines: string[];
            rightLines: string[];
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
                    leftLines: [],
                    rightLines: [],
                    leftType: 'fold',
                    rightType: 'fold',
                    leftNum: null,
                    rightNum: null,
                    lineCount: 1
                };
            }
            const leftLines = wrapText(this.unescapeHtml(row.left.raw ?? ''), maxContentWidth);
            const rightLines = wrapText(this.unescapeHtml(row.right.raw ?? ''), maxContentWidth);
            return {
                isFold: false,
                leftLines,
                rightLines,
                leftType: row.left.type,
                rightType: row.right.type,
                leftNum: row.left.lineNumber,
                rightNum: row.right.lineNumber,
                lineCount: Math.max(leftLines.length, rightLines.length)
            };
        });

        const totalVisualLines = visualRows.reduce((sum, vr) => sum + vr.lineCount, 0);

        // Create canvas at 2x resolution for crisp rendering
        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth * SCALE;
        canvas.height = (headerHeight + totalVisualLines * lineHeight + 4) * SCALE;

        const ctx = canvas.getContext('2d')!;
        ctx.scale(SCALE, SCALE);

        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasWidth, canvas.height / SCALE);

        // Header: file names
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, canvasWidth, 36);
        ctx.fillStyle = '#212529';
        ctx.font = uiFont(14, true);
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        ctx.fillText(`${leftFile.name}  ↔  ${rightFile.name}`, 12, 18);

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

        // Draw content rows
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

            const drawSide = (
                lineNum: number | null,
                wrappedLines: string[],
                type: string,
                offsetX: number
            ): void => {
                // Line number gutter
                ctx.fillStyle = '#f8f9fa';
                ctx.fillRect(offsetX, y, numColWidth, rowH);
                if (lineNum != null) {
                    ctx.fillStyle = '#adb5bd';
                    ctx.font = monoFont;
                    ctx.textAlign = 'right';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(String(lineNum), offsetX + numColWidth - 6, y + lineHeight / 2);
                }

                // Content area
                const bg = this.getBgColor(type);
                ctx.fillStyle = bg === 'transparent' ? '#ffffff' : bg;
                ctx.fillRect(offsetX + numColWidth, y, halfWidth, rowH);
                ctx.fillStyle = '#212529';
                ctx.textAlign = 'left';
                ctx.font = monoFont;
                ctx.textBaseline = 'middle';

                // Draw each wrapped line — no maxWidth squishing
                wrappedLines.forEach((line, li) => {
                    ctx.fillText(line, offsetX + numColWidth + padding, y + li * lineHeight + lineHeight / 2);
                });
            };

            drawSide(vr.leftNum, vr.leftLines, vr.leftType, 0);
            drawSide(vr.rightNum, vr.rightLines, vr.rightType, numColWidth + halfWidth);

            // Row separator
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, y + rowH - 1, canvasWidth, 1);

            // Center divider
            ctx.fillStyle = '#dee2e6';
            ctx.fillRect(numColWidth + halfWidth - 1, y, 2, rowH);

            currentY += rowH;
        });

        canvas.toBlob(blob => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `diff-${Date.now()}.png`;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }, 'image/png');
    }

    private buildPdfExport(result: DiffResult, leftFile: FileContent, rightFile: FileContent): string {
        const rows = result.sideBySideRows
            .map(row => {
                if (row.left.type === 'fold') {
                    const count = row.left.foldedCount ?? 0;
                    return `<tr class="fold-row"><td colspan="4">··· ${count} unchanged lines ···</td></tr>`;
                }

                const leftBg = this.getPrintBgColor(row.left.type);
                const rightBg = this.getPrintBgColor(row.right.type);
                const leftNum = row.left.lineNumber ?? '';
                const rightNum = row.right.lineNumber ?? '';
                const leftContent = this.escapeHtml(this.unescapeHtml(row.left.raw ?? '')) || '&nbsp;';
                const rightContent = this.escapeHtml(this.unescapeHtml(row.right.raw ?? '')) || '&nbsp;';

                return `<tr>
  <td class="num">${leftNum}</td>
  <td class="code" style="background:${leftBg}">${leftContent}</td>
  <td class="num">${rightNum}</td>
  <td class="code" style="background:${rightBg}">${rightContent}</td>
</tr>`;
            })
            .join('\n');

        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Diff: ${this.escapeHtml(leftFile.name)} vs ${this.escapeHtml(rightFile.name)}</title>
<style>
  @page { size: A3 landscape; margin: 12mm; }
  * { box-sizing: border-box; }
  body {
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 13px;
    margin: 0;
    padding: 0;
    background: #fff;
    color: #212529;
  }
  .header {
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 2px solid #dee2e6;
  }
  .header h1 {
    font-size: 15px;
    font-weight: bold;
    margin: 0 0 6px;
  }
  .badges {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .badge {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 3px;
  }
  .badge-add  { background: #d4edda; color: #155724; }
  .badge-rem  { background: #f8d7da; color: #721c24; }
  .badge-mod  { background: #fff3cd; color: #856404; }
  .badge-sim  { background: #e9ecef; color: #444; }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
    table-layout: fixed;
  }
  thead th {
    background: #f5f5f5;
    font-weight: bold;
    padding: 4px 6px;
    text-align: left;
    border-bottom: 2px solid #dee2e6;
    font-size: 11px;
  }
  thead th.num-col { width: 42px; }
  td {
    border-bottom: 1px solid #f0f0f0;
    vertical-align: top;
    padding: 1px 0;
  }
  td.num {
    width: 42px;
    text-align: right;
    padding: 2px 6px;
    color: #adb5bd;
    background: #f8f9fa;
    font-family: "Courier New", Consolas, monospace;
    font-size: 11px;
    border-right: 1px solid #dee2e6;
    white-space: nowrap;
    user-select: none;
  }
  td.code {
    font-family: "Courier New", Consolas, monospace;
    padding: 2px 6px;
    white-space: pre-wrap;
    word-break: break-all;
    line-height: 1.5;
  }
  tr.fold-row td {
    background: #e9ecef;
    text-align: center;
    font-style: italic;
    color: #868e96;
    padding: 3px;
    font-size: 11px;
  }
  tr { page-break-inside: avoid; }
  .center-divider { border-left: 2px solid #dee2e6; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
<div class="header">
  <h1>Diff: ${this.escapeHtml(leftFile.name)} &nbsp;↔&nbsp; ${this.escapeHtml(rightFile.name)}</h1>
  <div class="badges">
    <span class="badge badge-add">+${result.totalAdded} added</span>
    <span class="badge badge-rem">−${result.totalRemoved} removed</span>
    <span class="badge badge-mod">~${result.totalModified} modified</span>
    <span class="badge badge-sim">${result.similarityPercent}% similar</span>
  </div>
</div>
<table>
<thead>
  <tr>
    <th class="num-col"></th>
    <th>${this.escapeHtml(leftFile.name)}</th>
    <th class="num-col center-divider"></th>
    <th>${this.escapeHtml(rightFile.name)}</th>
  </tr>
</thead>
<tbody>
${rows}
</tbody>
</table>
</body>
</html>`;
    }

    private getPrintBgColor(type: string): string {
        switch (type) {
            case 'added': return '#d4edda';
            case 'removed': return '#f8d7da';
            case 'modified': return '#fff3cd';
            default: return 'transparent';
        }
    }

    private buildHtmlExport(result: DiffResult, leftFile: FileContent, rightFile: FileContent): string {
        const rows = result.sideBySideRows
            .map(row => {
                const leftBg = this.getBgColor(row.left.type);
                const rightBg = this.getBgColor(row.right.type);
                const leftNum = row.left.lineNumber ?? '';
                const rightNum = row.right.lineNumber ?? '';
                const leftContent = this.renderTokensOrRaw(row.left);
                const rightContent = this.renderTokensOrRaw(row.right);

                if (row.left.type === 'fold') {
                    const count = row.left.foldedCount ?? 0;
                    return `<tr style="background:#e8e8e8"><td colspan="4" style="padding:4px 8px;text-align:center;color:#666;font-style:italic">... ${count} unchanged lines ...</td></tr>`;
                }

                return `<tr>
  <td style="width:40px;text-align:right;padding:2px 8px;color:#999;background:#f5f5f5;border-right:1px solid #ddd;user-select:none;white-space:nowrap">${leftNum}</td>
  <td style="background:${leftBg};padding:2px 8px;font-family:monospace;white-space:pre-wrap;word-break:break-all;overflow-wrap:break-word">${leftContent}</td>
  <td style="width:40px;text-align:right;padding:2px 8px;color:#999;background:#f5f5f5;border-left:1px solid #ddd;border-right:1px solid #ddd;user-select:none;white-space:nowrap">${rightNum}</td>
  <td style="background:${rightBg};padding:2px 8px;font-family:monospace;white-space:pre-wrap;word-break:break-all;overflow-wrap:break-word">${rightContent}</td>
</tr>`;
            })
            .join('\n');

        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Diff: ${this.escapeHtml(leftFile.name)} vs ${this.escapeHtml(rightFile.name)}</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 0; padding: 16px; background: #fff; }
  h1 { font-size: 1.1rem; color: #333; margin-bottom: 8px; }
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

    private getBgColor(type: string): string {
        switch (type) {
            case 'added': return '#d4edda';
            case 'removed': return '#f8d7da';
            case 'modified': return '#fff3cd';
            default: return 'transparent';
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
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
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
