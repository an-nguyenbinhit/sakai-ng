import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TagModule } from 'primeng/tag';

@Component({
    selector: 'p-home',
    standalone: true,
    imports: [RouterModule, TagModule],
    templateUrl: './home.html'
})
export class Home {}
