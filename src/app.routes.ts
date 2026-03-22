import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        children: [
            {
                path: '',
                loadComponent: () => import('./app/pages/home/home').then((m) => m.Home),
                title: 'Web Developer Tools - Regex, JSON, Formatter & Compare',
                data: {
                    description: 'A free collection of online utilities for developers: JSON Formatters, Regex Testers, Code Compare, Encoding/Decoding tools, and more.'
                }
            },
            {
                path: 'code-compare',
                loadComponent: () => import('./app/pages/code-compare/code-compare').then((m) => m.CodeCompare),
                title: 'Online Code Compare & Diff Tool',
                data: {
                    description: 'Instantly compare text or source code files online. Highlight differences and see what changed between versions.'
                }
            },
            {
                path: 'code-formatter',
                loadComponent: () => import('./app/pages/code-formatter/code-formatter').then((m) => m.CodeFormatter),
                title: 'Online Code Formatter & Beautifier',
                data: {
                    description: 'Free online code formatter and beautifier for HTML, CSS, JavaScript, TypeScript, XML, JSON, and SQL.'
                }
            },
            {
                path: 'json-tools',
                loadComponent: () => import('./app/pages/json-tools/json-tools').then((m) => m.JsonTools),
                title: 'JSON Formatter, Validator & Minifier',
                data: {
                    description: 'Online JSON formatter, validator, parser, and minifier tool to make JSON data easy to read and debug.'
                }
            },
            {
                path: 'regex-tester',
                loadComponent: () => import('./app/pages/regex-tester/regex-tester').then((m) => m.RegexTester),
                title: 'Online Regex Tester & Debugger',
                data: {
                    description: 'Test, debug, and learn regular expressions with our free online RegEx tool. Supports multiple regex flavors.'
                }
            },
            {
                path: 'encode-decode',
                loadComponent: () => import('./app/pages/encode-decode/encode-decode').then((m) => m.EncodeDecode),
                title: 'URL & Base64 Encoder / Decoder',
                data: {
                    description: 'Free online tools to encode and decode text strings using Base64 or URL encoding.'
                }
            },
            {
                path: 'dummy-file-generator',
                loadComponent: () => import('./app/pages/dummy-file-generator/dummy-file-generator').then((m) => m.DummyFileGeneratorComponent),
                title: 'Dummy File Generator',
                data: {
                    description: 'Generate dummy files for testing purposes, specifying size, extension, and content.'
                }
            },
            {
                path: 'data-converter',
                loadComponent: () => import('./app/pages/data-converter/data-converter').then((m) => m.DataConverter),
                title: 'Data Converter for JSON, YAML, TOML, XML, CSV & TSV',
                data: {
                    description: 'Convert structured data between JSON, YAML, TOML, XML, CSV, and TSV with browser-only tooling and formatting shortcuts.'
                }
            },
            {
                path: 'text-utils',
                loadComponent: () => import('./app/pages/text-utils/text-utils').then((m) => m.TextUtils),
                title: 'Text Utilities for Cleanup, Sorting & Slugify',
                data: {
                    description: 'Clean up text quickly with line sorting, dedupe, case conversion, trimming, blank line removal, and slug generation.'
                }
            },
            {
                path: 'jwt-hash-uuid',
                loadComponent: () => import('./app/pages/jwt-hash-uuid/jwt-hash-uuid').then((m) => m.JwtHashUuid),
                title: 'JWT Decoder, Hash Generator & UUID Tools',
                data: {
                    description: 'Inspect JWT payloads, generate MD5 and SHA hashes, and create UUID, ULID, and Nano ID values locally in your browser.'
                }
            },
            {
                path: 'timestamp-cron',
                loadComponent: () => import('./app/pages/timestamp-cron/timestamp-cron').then((m) => m.TimestampCron),
                title: 'Timestamp Converter & Cron Expression Helper',
                data: {
                    description: 'Convert Unix timestamps, preview timezones, explain cron expressions, and inspect upcoming run times.'
                }
            },
            {
                path: 'url-tools',
                loadComponent: () => import('./app/pages/url-tools/url-tools').then((m) => m.UrlTools),
                title: 'URL Parser, Query Builder & Transport Encoders',
                data: {
                    description: 'Parse URLs, edit query parameters, and encode or decode Base64, URL, HTML, and JSON string payloads.'
                }
            },
            {
                path: 'schema-lab',
                loadComponent: () => import('./app/pages/schema-lab/schema-lab').then((m) => m.SchemaLab),
                title: 'Schema Lab for JSON Schema, TypeScript & Zod',
                data: {
                    description: 'Infer JSON Schema from real payloads, validate samples, and generate TypeScript or Zod models locally in the browser.'
                }
            },
            {
                path: 'query-playground',
                loadComponent: () => import('./app/pages/query-playground/query-playground').then((m) => m.QueryPlayground),
                title: 'Query Playground for JSONPath & XPath',
                data: {
                    description: 'Run JSONPath and XPath queries against JSON or XML payloads, inspect exact match paths, and review tree-shaped results locally.'
                }
            },
            {
                path: 'mock-data-generator',
                loadComponent: () => import('./app/pages/mock-data-generator/mock-data-generator').then((m) => m.MockDataGenerator),
                title: 'Mock Data Generator for Seeded JSON Fixtures',
                data: {
                    description: 'Generate seeded mock JSON fixtures with names, emails, dates, enums, and numeric fields from a lightweight field model.'
                }
            }
        ]
    },
    { path: '**', redirectTo: '' }
];
