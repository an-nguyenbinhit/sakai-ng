import { Injectable } from '@angular/core';
import { DiffResult } from '../models/diff.models';
import { FileContent } from '../models/diff.models';

@Injectable({ providedIn: 'root' })
export class ExportService {
    async copyUnifiedDiff(result: DiffResult, leftName: string, rightName: string): Promise<void> {
        const text = this.buildUnifiedDiff(result, leftName, rightName);
        await navigator.clipboard.writeText(text);
    }

    exportHtml(result: DiffResult, leftFile: FileContent, rightFile: FileContent): void {
        const html = this.buildHtmlExport(result, leftFile, rightFile);
        this.downloadFile(`diff-${Date.now()}.html`, html, 'text/html;charset=utf-8');
    }

    exportPatch(result: DiffResult, leftFile: FileContent, rightFile: FileContent): void {
        const text = this.buildUnifiedDiff(result, leftFile.name, rightFile.name);
        this.downloadFile(`${leftFile.name}.diff`, text, 'text/plain;charset=utf-8');
    }

    private buildUnifiedDiff(result: DiffResult, leftName: string, rightName: string): string {
        const lines: string[] = [];
        lines.push(`--- a/${leftName}`);
        lines.push(`+++ b/${rightName}`);

        let leftLine = 1;
        let rightLine = 1;

        // Group into hunks for unified diff format
        const rows = result.sideBySideRows;
        let i = 0;

        while (i < rows.length) {
            // Skip fold rows
            if (rows[i].left.type === 'fold') {
                const count = rows[i].left.foldedCount ?? 0;
                leftLine += count;
                rightLine += count;
                i++;
                continue;
            }

            // Collect hunk
            const hunkStart = i;
            const hunkLines: string[] = [];
            let leftStart = leftLine;
            let rightStart = rightLine;
            let leftCount = 0;
            let rightCount = 0;

            while (i < rows.length && rows[i].left.type !== 'fold') {
                const row = rows[i];
                const leftType = row.left.type;
                const rightType = row.right.type;

                if (leftType === 'removed' || leftType === 'modified') {
                    hunkLines.push(`-${this.unescapeHtml(row.left.raw)}`);
                    leftCount++;
                    leftLine++;
                }
                if (rightType === 'added' || rightType === 'modified') {
                    hunkLines.push(`+${this.unescapeHtml(row.right.raw)}`);
                    rightCount++;
                    rightLine++;
                }
                if (leftType === 'unchanged') {
                    hunkLines.push(` ${this.unescapeHtml(row.left.raw)}`);
                    leftCount++;
                    rightCount++;
                    leftLine++;
                    rightLine++;
                }
                i++;
            }

            if (hunkLines.length > 0) {
                lines.push(`@@ -${leftStart},${leftCount} +${rightStart},${rightCount} @@`);
                lines.push(...hunkLines);
            }
        }

        return lines.join('\n') + '\n';
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
