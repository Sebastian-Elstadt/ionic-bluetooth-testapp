import { Routes } from '@angular/router';

export const AppRoutes: Routes = [
    { path: 'device-scan', loadComponent: () => import('./pages/devices-scan/devices-scan.page').then(p => p.DevicesScanPage) },
    { path: 'device-communication', loadComponent: () => import('./pages/device-communication/device-communication.page').then(p => p.DeviceCommunicationPage) },
    { path: '', redirectTo: '/device-scan', pathMatch: 'full' }
];
