import { Injectable } from '@angular/core';

import { BleClient, dataViewToText, hexStringToDataView, textToDataView } from '@capacitor-community/bluetooth-le';
import { Platform } from '@ionic/angular';
import { HostDeviceService } from './host-device.service';
import { LoggingService } from '../classes/logging-service.class';
import { ENABLE_BLUETOOTH_LOGGING } from 'src/app/app.config';
import { Observable, Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class BluetoothService extends LoggingService {
    private connections: IBluetoothDevice[] = [];
    public get connectedDevices() { return this.connections; }

    private _isInitialized = false;
    public get isInitialized() { return this._isInitialized; }

    constructor(
        private platform: Platform,
        private hostDeviceService: HostDeviceService
    ) {
        super('BT', 'blue', ENABLE_BLUETOOTH_LOGGING);

        platform.ready().then(() => {
            if (hostDeviceService.ArePluginsSupported()) this.Initialize();
            else this.LogWarning('not supported');
        });
    }

    private async Initialize() {
        if (this.isInitialized) return;

        try {
            this.LogInfo('initializing...');
            await BleClient.initialize();
            this._isInitialized = true;
        }
        catch (err) {
            this.LogError('init failed.', err);
        }
    }

    // Scanning
    public StartScan() {
        if (!this.isInitialized) return;

        return new Observable<IBluetoothDevice>(observer => {
            this.LogInfo('starting scan...');

            BleClient.requestLEScan({}, d => {
                observer.next({
                    Name: d.device.name || d.localName || 'Unknown',
                    MacAddress: d.device.deviceId,
                    Plugin: BluetoothPlugin.LowEnergy
                });
            }).catch(err => {
                this.LogError('scan failure.', err);
                observer.error(err);
                observer.complete();
            });
        });
    }

    public async StopScan() {
        if (!this.isInitialized) return;
        this.LogInfo('stopping scan...');
        await BleClient.stopLEScan();
    }

    // Connections
    public ConnectDevice(dev: IBluetoothDevice, onDisconnect?: (device: IBluetoothDevice) => void) {
        return new Promise<void>(async (resolve, reject) => {
            this.LogInfo('connecting to device...', dev);

            try {
                if (dev.Plugin === BluetoothPlugin.LowEnergy) {
                    await BleClient.connect(dev.MacAddress, macAddress => {
                        this.connections = this.connections.filter(c => c.MacAddress !== macAddress);
                        if (onDisconnect) onDisconnect(dev);
                    });

                    this.connections.push(structuredClone(dev));
                    this.LogInfo('connected to', dev.Name);
                    resolve();
                }
                else resolve(); // TODO handle serial
            }
            catch (err) {
                this.LogError('connection failure.', err);
                reject(err);
            }
        });
    }

    public DisconnectDevice(dev: IBluetoothDevice) {
        return new Promise<void>(async (resolve, reject) => {
            this.LogInfo('disconnecting from device...', dev);

            try {
                if (dev.Plugin === BluetoothPlugin.LowEnergy) {
                    await BleClient.disconnect(dev.MacAddress);
                    this.LogInfo('disconnected from device.', dev.Name);
                    resolve();
                }
                else resolve(); // TODO handle serial
            }
            catch (err) {
                this.LogError(err);
                reject(err);
            }
        });
    }

    public ReconnectDevice(dev: IBluetoothDevice, onDisconnect?: (device: IBluetoothDevice) => void) {
        return new Promise<void>(async (resolve, reject) => {
            this.LogInfo('reconnecting to device...', dev);

            try {
                if (dev.Plugin === BluetoothPlugin.LowEnergy) {
                    if (this.platform.is('android')) {
                        await this.ConnectDevice(dev, onDisconnect);
                        this.LogInfo('reconnect success with', dev.Name);
                        resolve();
                        return;
                    }

                    await BleClient.getDevices([dev.MacAddress]);
                    this.LogInfo('reconnect success with', dev.Name);
                    this.connections.push(structuredClone(dev));
                    resolve();
                }
                else resolve(); // TODO handle serial
            }
            catch (err) {
                this.LogError('reconnect failed.', { error: err, device: dev });
                reject(err);
            }
        });
    }

    public IsDeviceConnected(dev?: IBluetoothDevice) {
        if (!dev) return false;
        return this.connections.some(c => c.MacAddress === dev.MacAddress);
    }

    // Read/Write
    public StartDeviceCommunication(options: {
        device: IBluetoothDevice;
        service: string;
        characteristic: string;
        onDataReceived: (data: string) => void | PromiseLike<void>;
        onError: (error: any) => void | PromiseLike<void>;
    }) {
        return new Promise<IBluetoothCommunicationHandle>(async (resolve, reject) => {
            const subject = new Subject<string>();

            try {
                await BleClient.startNotifications(options.device.MacAddress, options.service, options.characteristic, res => subject.next(dataViewToText(res)));
                this.LogInfo('started comms with', options.device);

                const subscription = subject.subscribe({
                    next: options.onDataReceived,
                    error: options.onError
                });

                resolve({
                    Stop: () => new Promise<void>(async (resolve, reject) => {
                        try {
                            subject.complete();
                            subscription.unsubscribe();
                            await BleClient.stopNotifications(options.device.MacAddress, options.service, options.characteristic);
                            this.LogInfo('stopped comms with', options.device);
                            resolve();
                        }
                        catch (err) {
                            this.LogError('comms stop failure with', { device: options.device, error: err });
                            reject(err);
                        }
                    })
                });
            }
            catch (err) {
                this.LogError('communication failure with', err);
                reject(err);
            }
        });
    }

    public WriteHexToDevice(dev: IBluetoothDevice, service: string, characteristic: string, data: string) {
        return BleClient.write(dev.MacAddress, service, characteristic, hexStringToDataView(data));
    }
}

export enum BluetoothPlugin {
    LowEnergy = 1,
    Serial = 2
};

export interface IBluetoothDevice {
    MacAddress: string;
    Name: string;
    Plugin?: BluetoothPlugin;
};

export interface IBluetoothCommunicationHandle {
    Stop: () => Promise<void>;
};