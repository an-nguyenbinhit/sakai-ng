import { Injectable } from '@angular/core';
import { DiffResult, FileContent } from '../models/diff.models';

@Injectable({ providedIn: 'root' })
export class ExportService {
    exportHtml(result: DiffResult, leftFile: FileContent, rightFile: FileContent): void {
        const html = this.buildHtmlExport(result, leftFile, rightFile);
        this.downloadFile(`diff-${Date.now()}.html`, html, 'text/html;charset=utf-8');
    }

    exportImage(result: DiffResult, leftFile: FileContent, rightFile: FileContent): void {
        const fontSize = 12;
        const lineHeight = 18;
        const numColWidth = 44;
        const contentPadding = 6;
        const headerHeight = 56;
        const canvasWidth = 1200;

        const rows = result.sideBySideRows;
        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = headerHeight + rows.length * lineHeight + 4;

        const ctx = canvas.getContext('2d')!;
        const halfWidth = (canvasWidth - numColWidth * 2) / 2;
        const monoFont = `${fontSize}px "Courier New", Consolas, monospace`;
        const uiFont = (size: number, bold = false) =>
            `${bold ? 'bold ' : ''}${size}px system-ui, -apple-system, sans-serif`;

        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Header: file names
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, canvasWidth, 36);
        ctx.fillStyle = '#212529';
        ctx.font = uiFont(13, true);
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        ctx.fillText(`${leftFile.name}  ↔  ${rightFile.name}`, 12, 18);

        // Stats row
        ctx.fillStyle = '#fcfcfc';
        ctx.fillRect(0, 36, canvasWidth, 20);
        ctx.font = uiFont(11);
        ctx.textBaseline = 'middle';

        const drawBadge = (text: string, fg: string, bg: string, x: number): number => {
            const w = ctx.measureText(text).width + 12;
            ctx.fillStyle = bg;
            ctx.fillRect(x, 40, w, 13);
            ctx.fillStyle = fg;
            ctx.fillText(text, x + 6, 47);
            return x + w + 8;
        };

        let sx = 12;
        sx = drawBadge(`+${result.totalAdded} added`, '#155724', '#d4edda', sx);
        sx = drawBadge(`-${result.totalRemoved} removed`, '#721c24', '#f8d7da', sx);
        sx = drawBadge(`~${result.totalModified} modified`, '#856404', '#fff3cd', sx);
        drawBadge(`${result.similarityPercent}% similar`, '#444444', '#e9ecef', sx);

        // Separator line
        ctx.fillStyle = '#dee2e6';
        ctx.fillRect(0, 55, canvasWidth, 1);

        // Content rows
        rows.forEach((row, i) => {
            const y = headerHeight + i * lineHeight;

            if (row.left.type === 'fold') {
                ctx.fillStyle = '#e9ecef';
                ctx.fillRect(0, y, canvasWidth, lineHeight);
                ctx.fillStyle = '#868e96';
                ctx.font = `italic ${fontSize - 1}px system-ui, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(
                    `··· ${row.left.foldedCount ?? 0} unchanged lines ···`,
                    canvasWidth / 2,
                    y + lineHeight / 2
                );
                ctx.textAlign = 'left';
                return;
            }

            const drawSide = (
                lineNum: number | null,
                raw: string,
                type: string,
                offsetX: number
            ): void => {
                // Line number column
                ctx.fillStyle = '#f8f9fa';
                ctx.fillRect(offsetX, y, numColWidth, lineHeight);
                ctx.fillStyle = '#adb5bd';
                ctx.font = monoFont;
                ctx.textAlign = 'right';
                ctx.textBaseline = 'middle';
                if (lineNum != null) {
                    ctx.fillText(String(lineNum), offsetX + numColWidth - 5, y + lineHeight / 2);
                }

                // Content column
                const bg = this.getBgColor(type);
                ctx.fillStyle = bg === 'transparent' ? '#ffffff' : bg;
                ctx.fillRect(offsetX + numColWidth, y, halfWidth, lineHeight);
                ctx.fillStyle = '#212529';
                ctx.textAlign = 'left';
                ctx.font = monoFont;
                const text = this.unescapeHtml(raw ?? '');
                ctx.fillText(
                    text,
                    offsetX + numColWidth + contentPadding,
                    y + lineHeight / 2,
                    halfWidth - contentPadding * 2
                );
            };

            drawSide(row.left.lineNumber, row.left.raw, row.left.type, 0);
            drawSide(
                row.right.lineNumber,
                row.right.raw,
                row.right.type,
                numColWidth + halfWidth
            );

            // Row separator
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, y + lineHeight - 1, canvasWidth, 1);

            // Center divider
            ctx.fillStyle = '#dee2e6';
            ctx.fillRect(numColWidth + halfWidth - 1, y, 2, lineHeight);
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
  <td style="width:40px;text-align:right;padding:0 8px;color:#999;background:#f5f5f5;border-right:1px solid #ddd;user-select:none">${leftNum}</td>
  <td style="background:${leftBg};padding:0 8px;font-family:monospace;white-space:pre">${leftContent}</td>
  <td style="width:40px;text-align:right;padding:0 8px;color:#999;background:#f5f5f5;border-right:1px solid #ddd;user-select:none">${rightNum}</td>
  <td style="background:${rightBg};padding:0 8px;font-family:monospace;white-space:pre">${rightContent}</td>
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
