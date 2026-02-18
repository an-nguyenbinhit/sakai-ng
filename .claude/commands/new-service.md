Create a new data service for the Sakai-NG project.

Arguments: $ARGUMENTS

## Instructions

Parse $ARGUMENTS to extract:
- **Entity name**: PascalCase singular (e.g. `User`, `Invoice`, `Category`)
- **Data source**: `mock` (default), `http`, or `http-crud`
- **Fields**: optional list of `fieldName:type` pairs — ask if not provided and entity is new

### Step 1 — Read existing services for context

Before writing, read one of the existing services to match the exact style:
- `src/app/pages/service/product.service.ts` — for mock data pattern
- `src/app/pages/service/icon.service.ts` — for HttpClient pattern

### Step 2 — Define the interface

```typescript
export interface {Entity} {
    id?: string;
    // fields derived from arguments
    createdAt?: Date;
}
```

### Step 3 — Create the service file

Create `src/app/pages/service/{entity-lower}.service.ts`:

**Pattern A — Mock data (default):**
```typescript
import { Injectable } from '@angular/core';

export interface {Entity} {
    id?: string;
    // fields
}

@Injectable()
export class {Entity}Service {
    private items: {Entity}[] = [
        // 5-10 realistic mock entries
    ];

    get{Entity}s(): Promise<{Entity}[]> {
        return Promise.resolve(this.items.map(item => ({ ...item })));
    }

    get{Entity}ById(id: string): Promise<{Entity} | undefined> {
        return Promise.resolve(this.items.find(item => item.id === id));
    }
}
```

**Pattern B — HTTP (when user specifies `http`):**
```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface {Entity} {
    id?: string;
    // fields
}

@Injectable()
export class {Entity}Service {
    private http = inject(HttpClient);
    private apiUrl = '/api/{entities}';

    get{Entity}s(): Promise<{Entity}[]> {
        return firstValueFrom(this.http.get<{Entity}[]>(this.apiUrl));
    }
}
```

**Pattern C — HTTP with full CRUD (when user specifies `http-crud`):**
```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface {Entity} {
    id?: string;
    // fields
}

@Injectable()
export class {Entity}Service {
    private http = inject(HttpClient);
    private apiUrl = '/api/{entities}';

    getAll(): Promise<{Entity}[]> {
        return firstValueFrom(this.http.get<{Entity}[]>(this.apiUrl));
    }

    getById(id: string): Promise<{Entity}> {
        return firstValueFrom(this.http.get<{Entity}>(`${this.apiUrl}/${id}`));
    }

    create(item: Omit<{Entity}, 'id'>): Promise<{Entity}> {
        return firstValueFrom(this.http.post<{Entity}>(this.apiUrl, item));
    }

    update(id: string, item: Partial<{Entity}>): Promise<{Entity}> {
        return firstValueFrom(this.http.put<{Entity}>(`${this.apiUrl}/${id}`, item));
    }

    delete(id: string): Promise<void> {
        return firstValueFrom(this.http.delete<void>(`${this.apiUrl}/${id}`));
    }
}
```

**Service conventions (non-negotiable):**
- `@Injectable()` with **no** `providedIn: 'root'`
  - Services must be provided at the component level via `providers: [{Entity}Service]`
  - This is consistent with `ProductService`, `CustomerService`, etc.
- Return `Promise<T>` not `Observable<T>` from public methods (use `firstValueFrom()` for HTTP)
- Use `inject()` for `HttpClient` (preferred over constructor injection)
- Interface exported from the same file as the service
- No `HttpClient` import unless `http` or `http-crud` is specified

### Step 4 — Report

List the created file as a clickable markdown link and show the exported interface for the user to verify.
Mention that to use the service, it must be added to `providers: [{Entity}Service]` in the consuming component.
