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
            }
        ]
    },
    { path: '**', redirectTo: '' }
];
