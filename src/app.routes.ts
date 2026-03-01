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
            }
        ]
    },
    { path: '**', redirectTo: '' }
];
