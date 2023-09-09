import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { BluetoothService, IBluetoothCommunicationHandle, IBluetoothDevice } from 'src/app/core/services/bluetooth.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-device-communication',
  templateUrl: './device-communication.page.html',
  styleUrls: ['./device-communication.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class DeviceCommunicationPage {
  private bluetoothDevice?: IBluetoothDevice;
  private bluetoothComHandle?: IBluetoothCommunicationHandle;

  constructor(
    private bluetoothService: BluetoothService,
    private route: ActivatedRoute,
    private nav: NavController
  ) { }

  public async ionViewWillEnter() {
    this.bluetoothDevice = {
      Name: this.route.snapshot.queryParamMap.get('name') || '',
      MacAddress: this.route.snapshot.queryParamMap.get('mac') || '',
      Plugin: 1
    };

    try {
      await this.bluetoothService.ConnectDevice(this.bluetoothDevice, () => {
        this.nav.back();
      });

      this.StartCommunication();
    }
    catch (err) {
      console.log(err);
      this.nav.back();
    }
  }

  public async StartCommunication() {
    this.bluetoothComHandle = await this.bluetoothService.StartDeviceCommunication({
      device: this.bluetoothDevice!,
      service: '0000FFE0-0000-1000-8000-00805F9B34FB',
      characteristic: '0000FFE1-0000-1000-8000-00805F9B34FB',
      onDataReceived: data => {
        console.log(data);
      },
      onError: err => {
        console.error(err);
      }
    });

    this.bluetoothService.WriteHexToDevice(this.bluetoothDevice!, '0000FFE0-0000-1000-8000-00805F9B34FB', '0000FFE1-0000-1000-8000-00805F9B34FB', 'F1003000000000000000000000000000C1F2');
  }

  public ionViewWillLeave() {
    this.bluetoothComHandle?.Stop();
    this.bluetoothService.DisconnectDevice(this.bluetoothDevice!);
  }
}