import { Injectable } from '@angular/core';
import { ConnectionBackend, RequestOptions, Request, RequestOptionsArgs, Response, Http, Headers } from '@angular/http';

import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';


@Injectable()
export class NoCacheHttpInterceptor extends Http {

    constructor(
        backend: ConnectionBackend,
        defaultOptions: RequestOptions,
        private router: Router
    ) {
        super(backend, defaultOptions);
    }

    request(url: string | Request, options?: RequestOptionsArgs): Observable<Response> {
        return super.request(url, options)
            .catch((error: Response) => {
                if (error.status === 401) {
                    localStorage.removeItem('DWallIsLogged');
                    localStorage.removeItem('DWallUserEmail');
                    localStorage.removeItem('DWallUserPass');
                    this.router.navigate(['/login']);
                }
                return Observable.throw(error);
            });
    }

    get(url: string): Observable<Response> {
        let options = new RequestOptions({
            headers: new Headers({
                'Cache-Control': 'o-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            })
        });
        return super.get(url, options);
    }

}