import { Component, ChangeDetectionStrategy, OnInit, ChangeDetectorRef, Input, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { switchMap, filter, debounceTime, tap } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { TvService } from '../../services/tv/tv.service';

@Component({
    selector: 'url-preview',
    templateUrl: './url-preview.component.html',
    styleUrls: ['./url-preview.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class UrlPreviewComponent implements OnInit, OnChanges, OnDestroy {

    @Input() src: string;
    @Input() newUrl = false;
    @Input() sizeNum: number;

    private sizes = {
        0: {
            width: 550,
            height: 320
        },
        1: {
            width: 1230,
            height: 750
        },
        2: {
            width: 2000,
            height: 800
        }
    }
    public size: any;
    public urlCanBePreviewed = false;
    public isFetching = false;
    private srcSubject: BehaviorSubject<string> = new BehaviorSubject('');
    private subscribtion: Subscription;

    constructor(
        private cd: ChangeDetectorRef,
        private tvService: TvService
    ) { }

    ngOnInit() {
        this.size = this.sizes[this.sizeNum];
        this.subscribtion = this.srcSubject
            .asObservable()
            .pipe(
                debounceTime(250),
                filter((url: string) => this.isValidUrl(url)),
                tap(() => {
                    this.isFetching = true;
                    this.cd.markForCheck();
                }),
                switchMap((val: string) => this.tvService.checkUrlForPreview(val))
            )
            .subscribe(
                (res: any) => {
                    this.handleResult(res);
                },
                (err) => {
                    this.handleResult(null);
                }
            );
    }

    ngOnChanges(c: SimpleChanges) {
        this.srcSubject.next(this.src);
    }

    ngOnDestroy() {
        this.subscribtion.unsubscribe();
    }

    private handleResult(res): void {
        this.urlCanBePreviewed = res && res.hasOwnProperty('canBeShown') ? res.canBeShown : false;
        this.isFetching = false;
        this.cd.markForCheck();
    }

    private isValidUrl(url: string): boolean {
        const pattern = new RegExp('^https?://.+', 'g');
        return pattern.test(url);
    }

    public get detectLoaderClass(): any {
        return {
            [`loader default-preview-url-loader-2`]: true
        }
    }

    public get detectDefaultUrlClass(): any {
        return {
            [`default-preview-url-${this.sizeNum}`]: true
        }
    }

}
