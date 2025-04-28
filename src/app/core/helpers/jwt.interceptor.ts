import { Injectable } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor,
} from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

import { AuthenticationService } from '../services/auth.service';
import { AuthfakeauthenticationService } from '../services/authfake.service';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
    constructor(
        private authenticationService: AuthenticationService,
        private authfackservice: AuthfakeauthenticationService,
        public router: Router
    ) { }

    intercept(
        request: HttpRequest<any>,
        next: HttpHandler
    ): Observable<HttpEvent<any>> {
        if (environment.defaultauth === 'firebase') {
            // add authorization header with jwt token if available
            let GodocUser = this.authenticationService.GodocUser();
            if (GodocUser && GodocUser.token) {
                request = request.clone({
                    setHeaders: {
                        Authorization: `Bearer ${GodocUser.token}`,
                    },
                });
            }
        } else {
            // add authorization header with jwt token if available
            const GodocUser = this.authfackservice.GodocUserValue;
            if (GodocUser && GodocUser.token) {
                request = request.clone({
                    setHeaders: {
                        Authorization: `Bearer ${GodocUser.token}`,
                    },
                });
            }
        }
        return next.handle(request).pipe(
            catchError((error) => {
                if (error.status === 401) {
                    this.router.navigate(['/auth/login']);
                }
                return throwError(error);
            })
        );;
    }
}
