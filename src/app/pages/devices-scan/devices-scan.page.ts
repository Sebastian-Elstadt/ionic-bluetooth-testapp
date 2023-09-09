import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { BluetoothService, IBluetoothDevice } from 'src/app/core/services/bluetooth.service';

@Component({
  selector: 'app-devices-scan',
  templateUrl: './devices-scan.page.html',
  styleUrls: ['./devices-scan.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class DevicesScanPage {
  public scannedDevices: IBluetoothDevice[] = [];

  constructor(
    private bluetoothService: BluetoothService,
    private nav: NavController
  ) { }

  public ionViewWillEnter() {
    this.bluetoothService.StartScan()?.subscribe({
      next: d => {
        console.log('GOT DEVICE', d);
        this.scannedDevices.push(d);
      },
      error: err => {
        console.error(err);
      }
    });
  }

  public OpenDevicePage(dev: IBluetoothDevice) {
    this.nav.navigateForward(`/device-communication`, { queryParams: { mac: dev.MacAddress, name: dev.Name } });
  }
}