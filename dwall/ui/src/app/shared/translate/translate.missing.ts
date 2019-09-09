import { MissingTranslationHandler, MissingTranslationHandlerParams } from '@ngx-translate/core';

export class DwMissingTranslationHandler implements MissingTranslationHandler {
    handle(params: MissingTranslationHandlerParams) {
        return params.key;
    }
}