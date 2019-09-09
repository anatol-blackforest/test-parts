import { TranslateModule, TranslateLoader, MissingTranslationHandler } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { HttpLoaderFactory } from './translate.factory';
import { DwMissingTranslationHandler } from './translate.missing';

export const TranslateConfig = TranslateModule.forRoot({
    loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
    },
    missingTranslationHandler: { provide: MissingTranslationHandler, useClass: DwMissingTranslationHandler },
    useDefaultLang: false
});
