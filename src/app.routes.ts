import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        children: [
            {
                path: '',
                loadComponent: () => import('./app/pages/home/home').then((m) => m.Home)
            },
            {
                path: 'code-compare',
                loadComponent: () => import('./app/pages/code-compare/code-compare').then((m) => m.CodeCompare)
            },
            {
                path: 'code-formatter',
                loadComponent: () => import('./app/pages/code-formatter/code-formatter').then((m) => m.CodeFormatter)
            },
            {
                path: 'json-tools',
                loadComponent: () => import('./app/pages/json-tools/json-tools').then((m) => m.JsonTools)
            },
            {
                path: 'regex-tester',
                loadComponent: () => import('./app/pages/regex-tester/regex-tester').then((m) => m.RegexTester)
            }
        ]
    },
    { path: '**', redirectTo: '' }
];
