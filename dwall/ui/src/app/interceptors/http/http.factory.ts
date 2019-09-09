import { XHRBackend, Http, RequestOptions } from '@angular/http';
import { HttpInterceptor } from './http.interceptor';

export function HttpFactory(xhrBackend: XHRBackend, requestOptions: RequestOptions): Http {
    return new HttpInterceptor(xhrBackend, requestOptions);
}