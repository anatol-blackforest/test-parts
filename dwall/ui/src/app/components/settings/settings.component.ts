import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/takeUntil';
import * as moment from 'moment-timezone';
import { UserService } from '../../services/user/user.service';
import { TvService } from '../../services/tv/tv.service';
import { ModalService } from '../../services/modal/modal.service';
import { mediaTypes } from '../../shared/helpers';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit, OnDestroy {

  public userData: any;
  private usedDevicesCount: number;

  public oldPassword: string;
  public newPassword: string;
  public confirmNewPassword: string;

  public fallback: any = { id: null };

  public media: { images: any[], videos: any[], stripes: any[] } = { images: [], videos: [], stripes: [] };

  public fallbackModalId: string = 'defaultFallbackModalId';

  public licence: any;
  private componetDestroyed: Subject<void> = new Subject();

  public expires: any;
  public lang: string;

  constructor(
    private userService: UserService,
    private tvService: TvService,
    private modalService: ModalService,
    private translate: TranslateService
  ) {
    this.lang = localStorage.getItem('dWallLang');
  }

  ngOnInit() {

    this.userService.fallback
      .subscribe(fallback => {
        if (fallback) { this.fallback = fallback; }
      })

    this.userService.userData
      .takeUntil(this.componetDestroyed)
      .subscribe(data => {
        if (data) {
          this.userData = data;
          this.expires = moment(data.licence_expires
            .split('T')[0])
            .add(1, 'days')
            .format('YYYY MMMM DD');
        }
      })

    this.userService.licence
      .subscribe(licence => {
        if (licence) { this.licence = licence; }
      })

    this.tvService.media
      .subscribe(media => {
        if (Array.isArray(media)) {
          this.media.images = media.filter((mediaItem) => mediaItem.mediaType == mediaTypes.image);
        }
      })

    this.tvService.tvs
      .subscribe((devices: any[]) => {
        if (Array.isArray(devices)) { this.usedDevicesCount = devices.length }
      })

  }

  ngOnDestroy() {
    this.componetDestroyed.next();
    this.componetDestroyed.complete();
  }

  setLang(): void {
    this.translate.use(this.lang);
    localStorage.setItem('dWallLang', this.lang);
  }

  public submitUserProfileData(): void {
    this.userService.updateUserData(
      this.userData.first_name,
      this.userData.address,
      this.userData.city,
      this.userData.company,
      this.userData.country,
      this.userData.state.replace(/\'/g, '"'),
      this.userData.postal_code
    ).subscribe(data => {
      this.translate.get('info.userDataUpdated')
        .subscribe((res: string) => {
          alert(res);
        });
    })
  }

  private clearPasswords(): void {
    this.newPassword = null;
    this.confirmNewPassword = null;
    this.oldPassword = null;
  }

  public submitPasswordChange(): void {
    this.userService.changePass(this.oldPassword, this.newPassword, this.confirmNewPassword)
      .subscribe(data => {
        this.translate.get('info.userDataUpdated')
          .subscribe((res: string) => {
            alert(res);
          });
        this.clearPasswords();
        localStorage.setItem('DWallUserPass', this.newPassword);
      }, (err) => {
        this.translate.get('errors.'.concat(err._body.replace(/\s/g, '')))
          .subscribe((res: string) => {
            alert(res);
          });
      })
  }

  public submitBillingChange(): void {
    this.userService.updateUserBillingData(
      this.userData.billing_name,
      this.userData.billing_address,
      this.userData.billing_city,
      this.userData.billing_country,
      this.userData.billing_state.replace(/\'/g, '"'),
      this.userData.billing_postal_code
    ).subscribe(data => {
      this.translate.get('info.billingUpdated')
        .subscribe((res: string) => {
          alert(res);
        });
    })
  }

  public selectDefaultFallback(): void {
    if (this.fallback && this.fallback.id) {
      this.userService.updateFallbackMedia(this.fallback.id)
        .subscribe(data => {
          this.translate.get('info.fallbackUpdated')
            .subscribe((res: string) => {
              alert(res);
            });
        })
    }
  }

  public openSelectFallbackModal(): void {
    this.modalService.open(this.fallbackModalId);
  }

  public selectFallback(image): void {
    this.fallback = image;
    if (image.id === this.userService._fallback.getValue().id) {
      this.fallback.changed = false;
    } else {
      this.fallback.changed = true;
    }
  }

  public revertToSettedFallback(): void {
    this.fallback = this.userService._fallback.getValue();
    if (!this.fallback.changed! && !this.fallback.hasOwnProperty('id')) {
      this.fallback = { id: null };
      return;
    }
    this.fallback.changed = false;
  }

  public closeModal(modalId: string): void {
    this.revertToSettedFallback();
    this.modalService.close(modalId);
  }

  public selectFallbackImage(): void {
    this.modalService.close(this.fallbackModalId);
  }

}
