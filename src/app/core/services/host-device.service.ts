import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';

@Injectable({
    providedIn: 'root'
})
export class HostDeviceService {
    constructor(
        private platform: Platform
    ) { }

    public ArePluginsSupported() {
        return this.platform.is('capacitor') || this.platform.is('cordova');
    }
}