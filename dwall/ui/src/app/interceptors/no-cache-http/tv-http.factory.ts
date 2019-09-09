import { XHRBackend, Http, RequestOptions } from '@angular/http';

import { Router } from '@angular/router';

import { NoCacheHttpInterceptor } from './tv-http.interceptor';

export function NoCacheHttpFactory(xhrBackend: XHRBackend, requestOptions: RequestOptions, router: Router): Http {
    return new NoCacheHttpInterceptor(xhrBackend, requestOptions, router);
}