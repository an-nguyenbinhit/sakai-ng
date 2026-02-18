Create a complete CRUD page for a new entity in the Sakai-NG project.

Arguments: $ARGUMENTS

## Instructions

Parse $ARGUMENTS to extract:
- **Entity name**: PascalCase singular (e.g. `User`, `Order`, `Invoice`)
- **Fields**: list of `fieldName:type` pairs (e.g. `name:string price:number status:string`) — ask the user if not provided
- **Route path**: kebab-case plural (e.g. `users`, `orders`) — derive from entity name if not given

### Step 1 — Read the existing CRUD for reference

Read `src/app/pages/crud/crud.ts` to understand the exact PrimeNG component usage pattern, signal-based state, and dialog structure. Match that pattern precisely.

### Step 2 — Create the entity service

Create `src/app/pages/service/{entity-lower}.service.ts`:

```typescript
import { Injectable } from '@angular/core';

export interface {Entity} {
    id?: string;
    // ...fields from arguments
}

@Injectable()
export class {Entity}Service {
    private items: {Entity}[] = [
        // 3-5 realistic mock items
    ];

    get{Entity}s(): Promise<{Entity}[]> {
        return Promise.resolve(this.items);
    }
}
```

**Service conventions:**
- `@Injectable()` with **no** `providedIn: 'root'` — must be provided at component level
- Returns `Promise<T[]>` from data methods (consistent with `ProductService` pattern)
- Include 3-5 realistic mock data entries
- No HTTP calls unless user specifically requests them

### Step 3 — Create the CRUD page component

Create `src/app/pages/{route-path}/{route-path}.ts`:

Follow the **exact** pattern from `src/app/pages/crud/crud.ts`:

```typescript
import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
// import additional PrimeNG modules matching the entity's fields

import { {Entity}, {Entity}Service } from '@/app/pages/service/{entity-lower}.service';

@Component({
    selector: 'app-{route-path}',
    standalone: true,
    imports: [
        CommonModule, TableModule, FormsModule, ButtonModule,
        ToastModule, ToolbarModule, InputTextModule, DialogModule,
        InputIconModule, IconFieldModule, ConfirmDialogModule, TagModule
        // add more as needed
    ],
    template: `
        <p-toast />
        <p-toolbar styleClass="mb-6">
            <ng-template #start>
                <p-button label="New" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="openNew()" />
                <p-button severity="secondary" label="Delete" icon="pi pi-trash" outlined
                    (onClick)="deleteSelected()" [disabled]="!selected || !selected.length" />
            </ng-template>
            <ng-template #end>
                <p-button label="Export" icon="pi pi-upload" severity="secondary" (onClick)="exportCSV()" />
            </ng-template>
        </p-toolbar>

        <p-table #dt [value]="items()" [rows]="10" [paginator]="true"
            [globalFilterFields]="[/* searchable fields */]"
            [(selection)]="selected" [rowHover]="true" dataKey="id"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
            [showCurrentPageReport]="true" [rowsPerPageOptions]="[10, 20, 30]">

            <ng-template #caption>
                <div class="flex items-center justify-between">
                    <h5 class="m-0">Manage {Entities}</h5>
                    <p-iconfield>
                        <p-inputicon styleClass="pi pi-search" />
                        <input pInputText type="text" (input)="onGlobalFilter(dt, $event)" placeholder="Search..." />
                    </p-iconfield>
                </div>
            </ng-template>

            <ng-template #header>
                <tr>
                    <th style="width: 3rem"><p-tableHeaderCheckbox /></th>
                    <!-- column headers -->
                    <th style="min-width: 12rem"></th>
                </tr>
            </ng-template>

            <ng-template #body let-item>
                <tr>
                    <td><p-tableCheckbox [value]="item" /></td>
                    <!-- column cells -->
                    <td>
                        <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="editItem(item)" />
                        <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="deleteItem(item)" />
                    </td>
                </tr>
            </ng-template>
        </p-table>

        <p-dialog [(visible)]="itemDialog" [style]="{ width: '450px' }" header="{Entity} Details" [modal]="true">
            <ng-template #content>
                <div class="flex flex-col gap-6">
                    <!-- form fields matching entity interface -->
                </div>
            </ng-template>
            <ng-template #footer>
                <p-button label="Cancel" icon="pi pi-times" text (click)="hideDialog()" />
                <p-button label="Save" icon="pi pi-check" (click)="saveItem()" />
            </ng-template>
        </p-dialog>

        <p-confirmdialog [style]="{ width: '450px' }" />
    `,
    providers: [MessageService, {Entity}Service, ConfirmationService]
})
export class {EntityPage} implements OnInit {
    itemDialog = false;
    items = signal<{Entity}[]>([]);
    item!: {Entity};
    selected: {Entity}[] | null = null;
    submitted = false;

    @ViewChild('dt') dt!: Table;

    constructor(
        private service: {Entity}Service,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.service.get{Entity}s().then(data => this.items.set(data));
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() { this.item = {}; this.submitted = false; this.itemDialog = true; }
    editItem(item: {Entity}) { this.item = { ...item }; this.itemDialog = true; }
    hideDialog() { this.itemDialog = false; this.submitted = false; }
    exportCSV() { this.dt.exportCSV(); }

    deleteSelected() {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete the selected items?',
            header: 'Confirm', icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.items.set(this.items().filter(v => !this.selected?.includes(v)));
                this.selected = null;
                this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Items Deleted', life: 3000 });
            }
        });
    }

    deleteItem(item: {Entity}) {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete this ${entity}?`,
            header: 'Confirm', icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.items.set(this.items().filter(v => v.id !== item.id));
                this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Item Deleted', life: 3000 });
            }
        });
    }

    saveItem() {
        this.submitted = true;
        // validate required fields
        // if valid: update or insert into items signal, close dialog
    }
}
```

### Step 4 — Register the route

Add to `src/app/pages/pages.routes.ts`:
```typescript
{
    path: '{route-path}',
    loadComponent: () => import('./{route-path}/{route-path}').then(m => m.{EntityPage})
}
```

### Step 5 — Add menu item

Add to `src/app/layout/component/app.menu.ts` under the "Pages" section:
```typescript
{ label: '{Entity} Management', icon: 'pi pi-{appropriate-icon}', routerLink: ['/pages/{route-path}'] }
```

### Step 6 — Report

List all files created/modified with clickable markdown links and a summary of the entity interface.
