import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export interface ToolShellStat {
    label: string;
    icon: string;
}

@Component({
    selector: 'app-tool-page-shell',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './tool-page-shell.html',
    styleUrl: './tool-page-shell.scss'
})
export class ToolPageShell {
    @Input({ required: true }) title = '';
    @Input({ required: true }) description = '';
    @Input() eyebrow = 'Frontend & Data';
    @Input() badges: string[] = [];
    @Input() stats: ToolShellStat[] = [];
}
