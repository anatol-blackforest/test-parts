import { Pipe, PipeTransform } from '@angular/core';

import { defineDevicesGroup } from '../../shared/functions';

import { IDevice } from '../../interfaces/device';
import { IGroup } from '../../interfaces/group';

@Pipe({
  name: 'devicesWithoutGroup'
})

export class DevicesWithoutGroupPipe implements PipeTransform {
  transform(devices: IDevice[], groups: IGroup[]): IDevice[] {
    if (devices && devices.length && groups && groups.length) {
      return devices.filter((device: IDevice) => {
        if (!defineDevicesGroup(device.guid, groups)) {
          return device;
        }
      });
    } else {
      return devices;
    }
  }
}
