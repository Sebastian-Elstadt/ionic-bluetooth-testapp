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
      readAs: 'numbers',
      onDataReceived: data => {
        const bytes = data as number[];
        console.log('GOT DATA!!!!!', {
          bytes,
          data
        });

        this.DecodeIncomingPayload(bytes);

        // const stringData = (data as string).replace(/\s/g, '');
        // const byteArray: number[] = [];
        // for (let c = 0; c < stringData.length; c += 2) { byteArray.push(parseInt(stringData.substring(c, c + 2), 16)); }

        // console.log('GOT DATA!!!!!', {
        //   stringData,
        //   data,
        //   bytes: byteArray
        // });

        // this.DecodeIncomingPayload(byteArray);
      },
      onError: err => {
        console.error(err);
      }
    });

    function hexToAscii(hexString: string) {
      let asciiString = '';

      for (let i = 0; i < hexString.length; i += 2) {
        const hexPair = hexString.substring(i, i + 2);
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

  private DecodeIncomingPayload(bytes: number[]) {
    // [241, 0, 48, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 62, 242]

    let weight = bytes[13] * 256 * 256 * 256 + 256 * 256 * bytes[14] + 256 * bytes[15] + bytes[16];
    weight /= Math.pow(10, bytes[10]);
    if (bytes[11] === 255) weight *= -1;

    console.log('decoded weight as', { weight });















    // const a2: number = ba255(bytes[1]);
    // const z = ba255(bytes[2]) & 0x01;
    // const a3 = ba255(bytes[3]);

    // if (ba255(bytes[4]) != 255 || ba255(bytes[5]) != 255 || ba255(bytes[6]) != 255 || ba255(bytes[7]) != 255) {
    //   let weight = ba255(bytes[7]) + (ba255(bytes[6]) * 256) + (65536 * ba255(bytes[5])) + (ba255(bytes[4]) * 16777216);
    //   console.log(structuredClone({
    //     a2, z, a3, weight
    //   }));

    //   if (z === 1) {
    //     weight *= -1;
    //   }

    //   for (let i = 0; i < a2; i++) {
    //     weight /= 10.0;
    //   }

    //   let unit = '';
    //   switch (a3) {
    //     case 0:
    //       unit = 'kg';
    //       break;
    //     case 1:
    //       unit = 'g';
    //       break;
    //     case 2:
    //       unit = 'lb';
    //       break;
    //     default:
    //       unit = 'unknown';
    //       break;
    //   }

    //   console.log('final weight', { weight, unit });
    // }
    // else if ((ba255(bytes[2]) & 0x01) === 1) {
    //   console.log('lower than -MAX-9e');
    // }
    // else {
    //   console.log('over than MAX+9e');
    // }
  }

  public ionViewWillLeave() {
    this.bluetoothComHandle?.Stop();
    this.bluetoothService.DisconnectDevice(this.bluetoothDevice!);
  }
}