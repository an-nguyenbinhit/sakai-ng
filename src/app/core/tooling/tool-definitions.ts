export type ToolStatus = 'live' | 'new' | 'planned';

export type ToolCategoryKey = 'format-validate' | 'convert-transform' | 'query-debug' | 'encode-security' | 'time-generators' | 'frontend-helpers';

export interface ToolCategoryDefinition {
    key: ToolCategoryKey;
    label: string;
    description: string;
    icon: string;
}

export interface ToolDefinition {
    label: string;
    description: string;
    route: string | null;
    icon: string;
    tags: string[];
    keywords: string[];
    category: ToolCategoryKey;
    badge?: string;
    status: ToolStatus;
    supportsFiles: boolean;
    supportsOffline: boolean;
    featured?: boolean;
    mostUsed?: boolean;
    menuVisible?: boolean;
}

export interface ToolNavigationGroup {
    category: ToolCategoryDefinition;
    tools: ToolDefinition[];
}

export const TOOL_CATEGORIES: ToolCategoryDefinition[] = [
    {
        key: 'format-validate',
        label: 'Format & Validate',
        description: 'Beautify, lint, normalize, and inspect structured content before it flows into other systems.',
        icon: 'pi pi-check-circle'
    },
    {
        key: 'convert-transform',
        label: 'Convert & Transform',
        description: 'Translate payloads and text between formats without leaving the browser.',
        icon: 'pi pi-refresh'
    },
    {
        key: 'query-debug',
        label: 'Query & Debug',
        description: 'Explore data shapes, match patterns, and compare content with diagnostics-first workflows.',
        icon: 'pi pi-search'
    },
    {
        key: 'encode-security',
        label: 'Encode & Security',
        description: 'Encode payloads, inspect tokens, and generate integrity checks with local-only tooling.',
        icon: 'pi pi-shield'
    },
    {
        key: 'time-generators',
        label: 'Time & Generators',
        description: 'Generate IDs, schedule strings, and timestamp conversions used in daily engineering work.',
        icon: 'pi pi-clock'
    },
    {
        key: 'frontend-helpers',
        label: 'Frontend Helpers',
        description: 'UI-facing helpers for styling, responsive work, and browser-focused implementation details.',
        icon: 'pi pi-palette'
    }
];

export const TOOL_DEFINITIONS: ToolDefinition[] = [
    {
        label: 'Code Compare',
        description: 'Diff two code snippets side-by-side with syntax highlighting and export.',
        route: '/code-compare',
        icon: 'pi pi-code',
        tags: ['Compare', 'Diff'],
        keywords: ['git diff', 'text compare', 'source compare', 'changes'],
        category: 'query-debug',
        status: 'live',
        supportsFiles: true,
        supportsOffline: true,
        featured: true,
        mostUsed: true,
        menuVisible: true
    },
    {
        label: 'Code Formatter',
        description: 'Format and beautify code across multiple languages instantly.',
        route: '/code-formatter',
        icon: 'pi pi-align-left',
        tags: ['Format', 'Beautify'],
        keywords: ['prettier', 'sql', 'html formatter', 'css formatter'],
        category: 'format-validate',
        status: 'live',
        supportsFiles: false,
        supportsOffline: true,
        featured: true,
        mostUsed: true,
        menuVisible: true
    },
    {
        label: 'JSON Tools',
        description: 'Validate, format, diff and transform JSON data effortlessly.',
        route: '/json-tools',
        icon: 'pi pi-database',
        tags: ['Validate', 'Format'],
        keywords: ['jsonpath', 'schema', 'json validate', 'minify'],
        category: 'format-validate',
        status: 'live',
        supportsFiles: false,
        supportsOffline: true,
        featured: true,
        mostUsed: true,
        menuVisible: true
    },
    {
        label: 'Container Check',
        description: 'Validate ISO 6346 container numbers, calculate check digits, and batch-review OCR-heavy lists.',
        route: '/container-check',
        icon: 'pi pi-box',
        tags: ['Container', 'ISO 6346'],
        keywords: ['container number', 'check digit', 'shipping', 'qc', 'ocr', 'bic'],
        category: 'format-validate',
        badge: 'New',
        status: 'new',
        supportsFiles: false,
        supportsOffline: true,
        featured: true,
        menuVisible: true
    },
    {
        label: 'Regex Tester',
        description: 'Test and debug regular expressions with live match highlighting.',
        route: '/regex-tester',
        icon: 'pi pi-search',
        tags: ['Regex', 'Debug'],
        keywords: ['pattern', 'replace', 'capture groups', 'cheatsheet'],
        category: 'query-debug',
        status: 'live',
        supportsFiles: false,
        supportsOffline: true,
        featured: true,
        mostUsed: true,
        menuVisible: true
    },
    {
        label: 'Encode / Decode',
        description: 'Encode and decode Base64, URL, HTML entities and more.',
        route: '/encode-decode',
        icon: 'pi pi-lock',
        tags: ['Encode', 'Decode'],
        keywords: ['base64', 'html entities', 'legacy transport'],
        category: 'encode-security',
        badge: 'Legacy',
        status: 'live',
        supportsFiles: false,
        supportsOffline: true,
        menuVisible: true
    },
    {
        label: 'Dummy File Generator',
        description: 'Generate dummy files of any size for testing upload limits and system storage.',
        route: '/dummy-file-generator',
        icon: 'pi pi-file-plus',
        tags: ['Generator', 'Testing'],
        keywords: ['sample file', 'payload size', 'upload testing'],
        category: 'time-generators',
        status: 'live',
        supportsFiles: true,
        supportsOffline: true,
        menuVisible: true
    },
    {
        label: 'Data Converter',
        description: 'Convert JSON, YAML, TOML, XML, CSV, and TSV with format-aware shortcuts.',
        route: '/data-converter',
        icon: 'pi pi-sync',
        tags: ['Convert', 'Transform'],
        keywords: ['yaml', 'toml', 'xml', 'csv', 'tsv', 'stringify'],
        category: 'convert-transform',
        badge: 'New',
        status: 'new',
        supportsFiles: true,
        supportsOffline: true,
        featured: true,
        menuVisible: true
    },
    {
        label: 'SQL Merge',
        description: 'Merge multiple SQL scripts into one ordered output with preview, warnings, and manifest export.',
        route: '/sql-merge',
        icon: 'pi pi-file-export',
        tags: ['SQL', 'Merge'],
        keywords: ['sql merge', 'deployment script', 'combine sql files', 'go separator'],
        category: 'convert-transform',
        badge: 'New',
        status: 'new',
        supportsFiles: true,
        supportsOffline: true,
        featured: true,
        menuVisible: true
    },
    {
        label: 'Text Utils',
        description: 'Clean, sort, dedupe, slugify, and reshape raw text with instant metrics.',
        route: '/text-utils',
        icon: 'pi pi-pencil',
        tags: ['Text', 'Cleanup'],
        keywords: ['slugify', 'sort lines', 'trim', 'dedupe', 'case convert'],
        category: 'convert-transform',
        badge: 'New',
        status: 'new',
        supportsFiles: true,
        supportsOffline: true,
        featured: true,
        menuVisible: true
    },
    {
        label: 'JWT / Hash / UUID',
        description: 'Decode JWTs, generate hashes, and create IDs locally without sending data anywhere.',
        route: '/jwt-hash-uuid',
        icon: 'pi pi-shield',
        tags: ['JWT', 'Hash', 'UUID'],
        keywords: ['md5', 'sha256', 'token', 'ulid', 'nanoid'],
        category: 'encode-security',
        badge: 'New',
        status: 'new',
        supportsFiles: true,
        supportsOffline: true,
        featured: true,
        menuVisible: true
    },
    {
        label: 'Timestamp & Cron',
        description: 'Convert timestamps, preview timezones, and explain cron schedules with next-run samples.',
        route: '/timestamp-cron',
        icon: 'pi pi-clock',
        tags: ['Time', 'Cron'],
        keywords: ['unix time', 'epoch', 'schedule', 'timezone'],
        category: 'time-generators',
        badge: 'New',
        status: 'new',
        supportsFiles: false,
        supportsOffline: true,
        featured: true,
        menuVisible: true
    },
    {
        label: 'URL Tools',
        description: 'Parse URLs, edit query parameters, and handle transport-safe encoders from one workspace.',
        route: '/url-tools',
        icon: 'pi pi-link',
        tags: ['URL', 'Transport'],
        keywords: ['query params', 'base64', 'json escape', 'html escape'],
        category: 'encode-security',
        badge: 'New',
        status: 'new',
        supportsFiles: false,
        supportsOffline: true,
        featured: true,
        menuVisible: true
    },
    {
        label: 'Query Playground',
        description: 'Run JSONPath and XPath queries against structured payloads with raw and tree outputs.',
        route: '/query-playground',
        icon: 'pi pi-sitemap',
        tags: ['JSONPath', 'XPath'],
        keywords: ['query', 'tree', 'inspect'],
        category: 'query-debug',
        badge: 'New',
        status: 'new',
        supportsFiles: true,
        supportsOffline: true,
        featured: true,
        menuVisible: true
    },
    {
        label: 'Schema Lab',
        description: 'Validate JSON Schema and generate frontend-friendly types from real sample payloads.',
        route: '/schema-lab',
        icon: 'pi pi-box',
        tags: ['Schema', 'Types'],
        keywords: ['typescript', 'zod', 'validation'],
        category: 'format-validate',
        badge: 'New',
        status: 'new',
        supportsFiles: true,
        supportsOffline: true,
        featured: true,
        menuVisible: true
    },
    {
        label: 'Mock Data Generator',
        description: 'Create seeded text, numbers, dates, and JSON payloads from a lightweight field model.',
        route: '/mock-data-generator',
        icon: 'pi pi-star',
        tags: ['Mock', 'Seed'],
        keywords: ['faker', 'sample payload', 'fixtures'],
        category: 'time-generators',
        badge: 'New',
        status: 'new',
        supportsFiles: false,
        supportsOffline: true,
        featured: true,
        menuVisible: true
    },
    {
        label: 'Color Tools',
        description: 'Convert color spaces, generate gradients, and check contrast before shipping UI tokens.',
        route: '/color-tools',
        icon: 'pi pi-palette',
        tags: ['Color', 'Contrast'],
        keywords: ['oklch', 'hex', 'rgb', 'css variables'],
        category: 'frontend-helpers',
        badge: 'New',
        status: 'new',
        supportsFiles: false,
        supportsOffline: true,
        featured: true,
        menuVisible: true
    },
    {
        label: 'Responsive Helper',
        description: 'Work with breakpoint presets, viewport notes, and responsive snippet generation.',
        route: '/responsive-helper',
        icon: 'pi pi-mobile',
        tags: ['Responsive', 'Breakpoints'],
        keywords: ['viewport', 'media query', 'layout'],
        category: 'frontend-helpers',
        badge: 'New',
        status: 'new',
        supportsFiles: false,
        supportsOffline: true,
        featured: true,
        menuVisible: true
    }
];

export const LIVE_MENU_TOOLS = TOOL_DEFINITIONS.filter((tool) => tool.menuVisible && tool.route);

export const TOOL_NAVIGATION_GROUPS: ToolNavigationGroup[] = TOOL_CATEGORIES.map((category) => ({
    category,
    tools: TOOL_DEFINITIONS.filter((tool) => tool.category === category.key)
}));
