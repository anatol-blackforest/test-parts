import { Component, OnInit, ElementRef, ChangeDetectorRef } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { TranslateService } from '@ngx-translate/core';
import 'rxjs/add/observable/forkJoin';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/combineLatest';

import { TvService } from '../../services/tv/tv.service';
import { ModalService } from '../../services/modal/modal.service';
import { UserService } from '../../services/user/user.service';

import * as moment from 'moment-timezone';

import { getMediaByUrl, findPlaylistById, findEventByTargetId, findDeviceByGUID, defineDevicesGroup, findGroupById } from '../../shared/functions';
import { mediaTypes, targetTypes } from './../../shared/helpers';

import { IDevice } from '../../interfaces/device';
import { IGroup } from '../../interfaces/group';

@Component({
  selector: 'app-tvs-tab',
  templateUrl: './tvs-tab.component.html',
  styleUrls: ['./tvs-tab.component.css']
})

export class TvsTabComponent implements OnInit {
  // all DWall data
  public tvs: IDevice[] = [];
  public groups: IGroup[] = [];
  public media: { images: any[], videos: any[], stripes: any[] } = { images: [], videos: [], stripes: [] };
  private schedules: any[];
  private playlists: any[];

  // modals
  public newTvModalId: string = 'newTvModalId';
  public tvDetailsModalId: string = 'tvDetailsModalId';
  public tvQRCodeModalId: string = 'QRCodeModalId';
  public newTvGroupModalId: string = 'newTvGroupModalId';
  public fallbackModalId: string = 'fallbackModalId';
  public groupDetailsModalId: string = 'groupDetailsModalId';
  public newDeviceLicence: string = 'deviceLicenceModal';

  public updatingMode: boolean = false;

  public selectedTv: IDevice | any = null;
  public selectedGroup: IGroup | any = null;
  //public searchInput: string = '';
  public openedGroupIds: any[] = [];

  public fallback: any;
  public licence: any;

  constructor(
    public tvService: TvService,
    private modalService: ModalService,
    private elRef: ElementRef,
    private userService: UserService,
    private translate: TranslateService
  ) { }

  ngOnInit() {

    this.userService.fallback
      .subscribe(data => {
        if (data) { this.fallback = data }
      })

    this.tvService.stats
      .subscribe((stats: any) => {
        this.setDeviceStatuses(this.tvs, stats);
      })

    this.userService.licence
      .subscribe(licence => {
        if (licence && licence.hasOwnProperty('singlecast') && licence.hasOwnProperty('multicast')) { this.licence = licence; }
      })

    this.tvService.scheduleEvents
      .subscribe((events: any[]) => { this.schedules = events; })

    this.tvService.playlists
      .subscribe((playlists: any[]) => { this.playlists = playlists; })

    Observable.combineLatest(this.tvService.tvs, this.tvService.groups, this.tvService.stats)
      .subscribe(data => {
        if (Array.isArray(data[0]) && data[0].length) {
          data[0].forEach((device: IDevice) => {
            device.inGroup = this.defineDevicesGroup(device.guid, data[1]);
          })
          this.groups = data[1];
          this.tvs = data[0];


        } else {
          this.groups = data[1];
          this.tvs = data[0];
        }
        this.setDeviceStatuses(data[0], data[2]);
      })

    this.tvService.media
      .subscribe((media: any) => {
        if (Array.isArray(media)) {
          this.media.images = media.filter((mediaItem) => mediaItem.mediaType == mediaTypes.image);
        }
      });
  }

  private defineDevicesGroup(guid: string, groups: IGroup[]): string {
    let group: IGroup = defineDevicesGroup.call(this, guid, groups);
    return group ? group.name : '';
  }

  private setDeviceStatuses(devices: IDevice[], stats: any): void {
    if (devices && devices.length && Array.isArray(stats) && stats.length) {
      devices.forEach((device: IDevice) => {
        let statusObject = stats.find(status => status.guid === device.guid);
        device.status = statusObject ? statusObject.status : false;
      })
    }
  }

  private checkDeviceForContainingEvents(guid: string): boolean {
    let group = defineDevicesGroup(guid, this.groups);
    let isEvent = false;
    let device: IDevice = findDeviceByGUID(this.tvs, guid);
    if ((device.constant_play) && (device.playing_fallback == 0) && ((device.url && device.url !== ' ' && device.url !== this.fallback.url) || (device.playlist_id && device.playlists_status))) {
      isEvent = true;
    }
    this.schedules.forEach(event => {
      if (event.tv_guid === guid) {
        event.events.forEach(e => {
          if (new Date(e.end).valueOf() >= new Date().valueOf()) { isEvent = true; }
        })
      }
    });
    if (group) { isEvent = this.checkGroupForContainingEvents(group.id); }
    return isEvent;
  }

  public remove(guid: string): void {
    let approve: boolean;
    if (this.checkDeviceForContainingEvents(guid)) {
      this.translate.get('confirm.removeDeviceActiveEvents')
        .subscribe((res: string) => {
          approve = confirm(res);
        });
    } else {
      this.translate.get('confirm.deleteDevice')
        .subscribe((res: string) => {
          approve = confirm(res);
        });
    }
    if (approve) { this.tvService.removeTv(guid); }
  }

  public removeTvFromGroup(guid: string, groupId: number | string): void {
    let approve: boolean = false;
    if (this.checkGroupForContainingEvents(groupId)) {
      this.translate.get('confirm.removeDeviceActiveEvents')
        .subscribe((res: string) => {
          approve = confirm(res);
        });
    } else {
      this.translate.get('confirm.deleteDeviceFromGroup')
        .subscribe((res: string) => {
          approve = confirm(res);
        });
    }
    if (approve) {
      this.tvService.removeDeviceFromGroup(groupId, guid);
      this.collectOpenGroupIds();
    }
  }

  public openGroupDetailsModal(group: IGroup): void {
    this.selectedGroup = Object.assign({}, group);
    this.modalService.open(this.groupDetailsModalId);
  }

  public cancelUpdatingGroup(): void {
    this.updatingMode = false;
    this.selectedGroup = Object.assign({}, findGroupById(this.groups, this.selectedGroup.id));
  }

  public updateGroup(): void {
    this.updatingMode = false;
    this.tvService.updateGroup(this.selectedGroup);
    this.resetNewTvsGroupForm();
    this.modalService.close(this.groupDetailsModalId);
  }

  public saveNewTv(): void {
    if (!this.checkDeviceNames(this.selectedTv.tv_name)) {
      this.translate.get('errors.nameExists')
        .subscribe((res: string) => {
          alert(res);
        });
    } else {
      this.tvService.addTv({
        name: this.selectedTv.tv_name,
        location: this.selectedTv.tv_location,
        notes: this.selectedTv.tv_note,
        orientation: this.selectedTv.orientation,
        playLocalyStatus: +this.selectedTv.playLocalyStatus,
        limit: this.selectedTv.limit,
        isMulticast: this.selectedTv.is_multicast
      });
      this.resetAddNewTvForm();
      this.modalService.close(this.newDeviceLicence);
      this.modalService.close(this.newTvModalId);
    }
  }

  public closePreview(event): void {
    event.preventDefault();
    this.modalService.close(this.tvDetailsModalId);
  }

  public closePreviewGroup(event): void {
    event.preventDefault();
    this.modalService.close(this.groupDetailsModalId);
  }

  public closeModal(modalId: string): void {
    switch (modalId) {
      case this.tvQRCodeModalId:
        this.modalService.open(this.tvDetailsModalId);
        break;
      case this.newTvModalId:
        this.modalService.close(this.newDeviceLicence);
        this.resetAddNewTvForm();
        break;
      case this.tvDetailsModalId:
        this.updatingMode = false;
        break;
      case this.fallbackModalId:
        this.modalService.open(this.tvDetailsModalId);
        break;
      case this.newTvGroupModalId:
      case this.groupDetailsModalId:
        this.updatingMode = false;
        this.resetNewTvsGroupForm();
        break;
      default:
        break;
    }
    this.modalService.close(modalId);
  }

  private checkDeviceNames(name: string): boolean {
    return this.tvs.every((device: IDevice) => device.tv_name !== name);
  }

  private resetAddNewTvForm(): void {
    this.selectedTv = null;
  }

  public openPreviewModal(device: IDevice): void {
    this.selectedTv = Object.assign({}, device);
    this.modalService.open(this.tvDetailsModalId);
  }

  public openQRCodeModal(): void {
    this.modalService.open(this.tvQRCodeModalId);
    this.modalService.close(this.tvDetailsModalId);
  }

  public chooseAllTvs(event): void {
    let checkboxes: any = this.elRef.nativeElement
      .querySelectorAll('.add-group-form .dw-line-item input[type=checkbox]');
    for (let i = 0; i < checkboxes.length; i++) {
      checkboxes[i].checked = event.target.checked;
    }
  }

  private getAllCheckedDevices(): string[] {
    let checkboxes: any = this.elRef.nativeElement
      .querySelectorAll('.add-group-form .dw-line-item input[type=checkbox]');
    let checked = [];
    for (let i = 0; i < checkboxes.length; i++) {
      if (checkboxes[i].checked) { checked.push(checkboxes[i].value); }
    }
    return checked;
  }

  private createNewGroupWithDevices(checked: string[]): void {
    this.collectOpenGroupIds();
    this.tvService.createDeviceGroup(this.selectedGroup.name)
      .subscribe((data) => {
        this.tvService.getAllGroups(true)
          //.map((response: any) => response.json())
          .subscribe((groups: IGroup[]) => {
            let groupsArray = Object.keys(groups)
              .map((key) => groups[key]);
            let observables = [];
            checked.forEach((guid: string) => {
              observables.push(this.tvService.addDevicesToGroup(groupsArray[groupsArray.length - 1].id, guid, true));
            })
            Observable.forkJoin(observables)
              .subscribe((resp) => {
                this.tvService.getAllGroups();
              })
          })
      })
  }

  private createEmptyGroup(): void {
    this.tvService.createDeviceGroup(this.selectedGroup.name)
      .subscribe((data) => {
        this.tvService.getAllGroups();
      })
    this.collectOpenGroupIds();
  }

  private checkDevicesForEvents(checked: string[]): boolean {
    checked = checked.map(elem => this.checkDeviceForContainingEvents(elem).toString());
    return checked.some(elem => elem === true.toString());
  }

  private checkDeviceForContainingPastEvents(checked: string[]): boolean {
    let isEvent: boolean = false;
    checked.forEach((guid) => {
      this.schedules.forEach(event => {
        if (event.tv_guid === guid) {
          event.events.forEach(e => {
            if (new Date(e.end).valueOf() < new Date().valueOf()) { isEvent = true; }
          })
        }
      });
    })
    return isEvent;
  }

  public saveNewTvsGroup(event: any): void {
    let checked: string[] = this.getAllCheckedDevices();
    if (this.checkDevicesForEvents(checked)) {
      this.translate.get('errors.addDevcieWithEvents')
        .subscribe((res: string) => {
          alert(res);
        });
      return;
    } else if (this.checkDeviceForContainingPastEvents(checked)) {
      this.translate.get('errors.removePastEvents')
        .subscribe((res: string) => {
          alert(res);
        });
      return;
    } {
      if (this.selectedGroup.hasOwnProperty('id')) {
        let observables = [];
        checked.forEach((guid: string) => {
          observables.push(this.tvService.addDevicesToGroup(this.selectedGroup.id.toString(), guid, true));
        })
        Observable.forkJoin(observables)
          .subscribe((resp) => {
            this.tvService.getAllGroups();
          })
      } else {
        if (checked.length) {
          this.createNewGroupWithDevices(checked);
        } else {
          this.createEmptyGroup();
        }
      }
      this.resetNewTvsGroupForm();
      this.collectOpenGroupIds();
    }
  }

  private resetNewTvsGroupForm(): void {
    this.selectedGroup = null;
    let pickAll: any = this.elRef.nativeElement
      .querySelector('#pick-all');
    let checkboxes: any = this.elRef.nativeElement
      .querySelectorAll('.add-group-form .dw-line-item input[type=checkbox]');
    for (let i = 0; i < checkboxes.length; i++) {
      checkboxes[i].checked = false;
    }
    if (pickAll && pickAll.checked) { pickAll.checked = false; }
    this.modalService.close(this.newTvGroupModalId);
  }

  public openAddTvToGroupModal(group: IGroup): void {
    if (group) {
      this.selectedGroup = group;
    } else {
      this.selectedGroup = {
        name: ''
      }
    }
    this.modalService.open(this.newTvGroupModalId);
  }

  private checkGroupForContainingEvents(groupId: string | number): boolean {
    let isEvent = false;
    let group: IGroup = findGroupById(this.groups, groupId);
    if (!group.on_schedule && !group.playing_fallback && ((group.URL && (group.URL != ' ') && (group.URL != '0') && (group.URL !== this.fallback.url)) || group.playlist_id)) {
      isEvent = true;
    }
    this.schedules.forEach(event => {
      if (event.group_id == groupId) {
        event.events.forEach(e => {
          if (new Date(e.end).valueOf() >= new Date().valueOf()) { isEvent = true; }
        })
      }
    })
    return isEvent;
  }

  public deleteGroup(event, groupId: string | number): void {
    event.preventDefault();
    let confirmDelete;
    if (this.checkGroupForContainingEvents(groupId)) {
      this.translate.get('confirm.removeGroupActiveEvents')
        .subscribe((res: string) => {
          confirmDelete = confirm(res);
        });
    } else {
      this.translate.get('confirm.deleteGroup')
        .subscribe((res: string) => {
          confirmDelete = confirm(res);
        });
    }
    if (confirmDelete) {
      this.tvService.removeDeviceGroup(groupId);
      this.modalService.close(this.groupDetailsModalId);
      this.resetNewTvsGroupForm();
      this.collectOpenGroupIds();
    }
  }

  public toggleGroup(event): void {
    let dwLine = event.target.parentElement.parentElement;
    let panel = dwLine.nextElementSibling;
    if (event.target.classList.contains('allow-toggle')) {
      dwLine.classList.toggle('active');
      dwLine.children[2].firstElementChild.classList.toggle('active-arrow');
      if (panel.style.maxHeight) {
        panel.style.maxHeight = null;
      } else {
        panel.style.maxHeight = panel.scrollHeight + 'px';
      }
    }
  }

  public updateTv(event): void {
    event.preventDefault();
    this.updatingMode = false;
    this.collectOpenGroupIds();
    this.tvService.updateTv({
      name: this.selectedTv.tv_name,
      location: this.selectedTv.tv_location,
      notes: this.selectedTv.tv_note || '',
      isMulticats: this.selectedTv.is_multicast,
      guid: this.selectedTv.guid,
      limit: this.selectedTv.limit,
      playLocalyStatus: +this.selectedTv.playLocalyStatus,
      orientation: this.selectedTv.orientation
    });
    this.modalService.close(this.tvDetailsModalId);
  }

  private collectOpenGroupIds(): void {
    this.openedGroupIds = Array.prototype
      .slice
      .call(document.getElementsByClassName('group-item active'))
      .map(e => +e.id);
  }

  public cancelUpdating(): void {
    this.updatingMode = false;
    this.selectedTv = Object.assign({}, findDeviceByGUID(this.tvs, this.selectedTv.guid))
  }

  public enableUpdatingMode(): void {
    this.updatingMode = true;
  }

  public openNewDeviceModal(): void {
    let anyMulticastAvailable: any[] = this.licence.multicast.filter(e => e.available);
    if ((this.licence.singlecast.available > 0 && anyMulticastAvailable.length > 0)) {
      this.modalService.open(this.newDeviceLicence);
      return;
    } else if (this.licence.singlecast.available > 0 && anyMulticastAvailable.length === 0) {
      this.selectNewDeviceLicence();
    } else if (this.licence.singlecast.available === 0 && anyMulticastAvailable.length === 1) {
      this.selectNewDeviceLicence(this.licence.multicast.find(e => e.available));
    } else if (this.licence.singlecast.available === 0 && anyMulticastAvailable.length > 1) {
      this.modalService.open(this.newDeviceLicence);
      return;
    } else {
      this.translate.get('errors.noLicence')
        .subscribe((res: string) => {
          alert(res);
        });
      return;
    }
    this.modalService.open(this.newDeviceLicence);
  }

  public selectNewDeviceLicence(licence: any = null): void {
    this.selectedTv = {
      orientation: 'landscape',
      playLocalyStatus: 1,
      tv_location: '',
      tv_name: '',
      tv_note: '',
      is_multicast: licence ? 1 : 0,
      limit: licence ? licence.devices : 1
    }
    this.modalService.close(this.newDeviceLicence);
    this.modalService.open(this.newTvModalId);
  }

}
