import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from 'src/app/store/Authentication/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthfakeauthenticationService {

    private GodocUserSubject: BehaviorSubject<User>;
    public GodocUser: Observable<User>;

    constructor(private http: HttpClient) {
        this.GodocUserSubject = new BehaviorSubject<User>(JSON.parse(sessionStorage.getItem('GodocUser')!));
        this.GodocUser = this.GodocUserSubject.asObservable();
    }

    /**
     * current user
     */
    public get GodocUserValue(): User {
        return this.GodocUserSubject.value;
    }

    /**
     * Performs the auth
     * @param email email of user
     * @param password password of user
     */
    login(email: string, password: string) {
        return this.http.post<any>(`/users/authenticate`, { email, password }).pipe(map(user => {
            // login successful if there's a jwt token in the response
            if (user && user.token) {
                // store user details and jwt token in local storage to keep user logged in between page refreshes
                sessionStorage.setItem('toast', 'true');
                sessionStorage.setItem('GodocUser', JSON.stringify(user));
                this.GodocUserSubject.next(user);
            }
            return user;
        }));
    }

    /**
     * Logout the user
     */
    logout() {
        // remove user from local storage to log user out
        sessionStorage.removeItem('GodocUser');
        this.GodocUserSubject.next(null!);
    }
}
