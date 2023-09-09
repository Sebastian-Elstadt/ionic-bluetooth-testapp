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
        const byteArray = new TextEncoder().encode(data);
        console.log('GOT DATA!!!!!', {
          data,
          bytes: byteArray
        });

        
      },
      onError: err => {
        console.error(err);
      }
    });

    function hexToAscii(hexString: string) {
      let asciiString = '';

      for (let i = 0; i < hexString.length; i += 2) {
        const hexPair = hexString.substr(i, 2);
        const asciiChar = String.fromCharCode(parseInt(hexPair, 16));
        asciiString += asciiChar;
      }

      return asciiString;
    }

    function byteArrayToHexString(byteArray: number[]) {
      return Array.from(byteArray, function (byte) {
        return ('0' + (byte & 0xFF).toString(16)).slice(-2);
      }).join('')
    }

    const byteArray = new Array(20);
    byteArray[0] = -15;
    byteArray[1] = 0;
    byteArray[2] = 48;
    byteArray[19] = -14;

    for (let i = 3; i < 18; i++) {
      byteArray[i] = 0;
    }

    let b = 0;
    for (let i = 0; i < 18; i++) {
      b = (b ^ byteArray[13]);
    }

    byteArray[18] = b;
    console.log(byteArray);
    // hexToAscii('F1003000000000000000000000000000C1F2')
    this.bluetoothService.WriteStringToDevice(this.bluetoothDevice!, '0000FFE0-0000-1000-8000-00805F9B34FB', '0000FFE1-0000-1000-8000-00805F9B34FB', hexToAscii(byteArrayToHexString(byteArray)));
  }

  public ionViewWillLeave() {
    this.bluetoothComHandle?.Stop();
    this.bluetoothService.DisconnectDevice(this.bluetoothDevice!);
  }
}