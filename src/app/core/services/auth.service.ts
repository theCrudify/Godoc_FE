import { Injectable } from '@angular/core';
import { getFirebaseBackend } from '../../authUtils';
import { User } from 'src/app/store/Authentication/auth.models';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { GlobalComponent } from "../../global-component";
import Swal from 'sweetalert2';

const AUTH_API = GlobalComponent.AUTH_API;

const httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({ providedIn: 'root' })

/**
 * Auth-service Component
 */
export class AuthenticationService {

    user!: User;
    currentUserValue: any;
    private currentUserSubject: BehaviorSubject<User>;

    private logoutTimer: any;
    private warningTimer: any;
    private refreshInterval: any;
    private monitorInterval: any;  // Added to store the monitoring interval

      constructor(private http: HttpClient) {
        this.currentUserSubject = new BehaviorSubject<User>(JSON.parse(localStorage.getItem('currentUser')!));

        // Check for remaining time on restart
        if (this.currentUserSubject.value) {  // Pastikan hanya jika ada user yang login
            const remainingTime = this.getRemainingTime();
            if (remainingTime > 0) {
                this.startLogoutTimer(remainingTime);
            }
        }

   
    }
    
    /**
     * Performs the auth
     * @param username email of user
     * @param password password of user
     */



    
    register(email: string, first_name: string, password: string) {
        // Register Api
        return this.http.post(AUTH_API + 'signup', {
            email,
            first_name,
            password,
        }, httpOptions);
    }

    /**
     * Performs the auth
     * @param username email of user
     * @param password password of user
     */
    login(username: string, password: string): Observable<any> {
        return this.http.post(AUTH_API + '/login', {
            username,
            password
        }, httpOptions).pipe(res => {
            this.startLogoutTimer(); // Start the logout timer after successful login
            return res;
        });
    }

    /**
     * Starts the logout timer
     * @param remainingTime - Optional, default to 10 minutes in milliseconds
     */
    private startLogoutTimer(remainingTime = 3 * 60 * 60 * 1000) {  // default 10 menit
        const warningTime = remainingTime - (20 * 60 * 1000); // Peringatan 5 menit sebelum logout


        // private startLogoutTimer(remainingTime = 1 * 60 * 1000) {  // default 10 menit
        //     const warningTime = remainingTime - (0.5 * 60 * 1000); // Peringatan 5 menit sebelum logout
    
        // Clear any previous timers
        if (this.logoutTimer) clearTimeout(this.logoutTimer);
        if (this.warningTimer) clearTimeout(this.warningTimer);

        // Simpan waktu logout dan warning dalam localStorage dengan enkripsi
        localStorage.setItem('logoutTime', this.encrypt((Date.now() + remainingTime).toString()));
        localStorage.setItem('warningTime', this.encrypt((Date.now() + warningTime).toString()));

        // Set timer untuk peringatan
        this.warningTimer = setTimeout(() => {
            this.showWarningAlert();
        }, warningTime);

        // Set timer untuk auto logout
        this.logoutTimer = setTimeout(() => {
            this.logout();
            Swal.fire({
                icon: 'info',
                title: 'Session Expired',
                text: 'You have been logged out due to inactivity.',
            });
        }, remainingTime);
    }

    /**
     * Show a warning alert 20 seconds before auto logout
     */
    private showWarningAlert() {
        Swal.fire({
            icon: 'warning',
            title: 'Auto Logout Warning',
            text: 'You will be logged out in 20 minutes due to inactivity.',
            timer: 1200000, // Timer for 20 seconds
            timerProgressBar: true,
            willClose: () => {
                clearTimeout(this.warningTimer); // Pastikan timer di-clear ketika alert ditutup
            }
        });

        // Additional warning at 10 seconds remaining
        setTimeout(() => {
            Swal.fire({
                icon: 'warning',
                title: 'Final Warning',
                text: '60 seconds left before you are logged out.',
                timer: 60000, // Timer for 10 seconds
                timerProgressBar: true,
            });
        }, 10000);
    }

    /**
     * Returns the remaining time before logout
     */
    private getRemainingTime(): number {
        const logoutTimeEncrypted = localStorage.getItem('logoutTime');
        if (!logoutTimeEncrypted) return 0;

        const logoutTime = parseInt(this.decrypt(logoutTimeEncrypted), 10);
        const remainingTime = logoutTime - Date.now();
        return remainingTime > 0 ? remainingTime : 0;  // Jika sudah habis, kembalikan 0
    }

    /**
     * Enkripsi sederhana menggunakan base64
     */
    private encrypt(value: string): string {
        return btoa(value);  // Enkripsi sederhana dengan base64
    }

    /**
     * Dekripsi sederhana menggunakan base64
     */
    private decrypt(value: string): string {
        return atob(value);  // Dekripsi sederhana dengan base64
    }

    /**
     * Logout the user
     */
    logout(): Promise<void> {
        return new Promise<void>((resolve) => {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('token');
            localStorage.removeItem('logoutTime');
            localStorage.removeItem('warningTime');
            
            if (this.logoutTimer) clearTimeout(this.logoutTimer);
            if (this.warningTimer) clearTimeout(this.warningTimer);
            if (this.refreshInterval) clearInterval(this.refreshInterval); // Stop auto-refresh on logout if previously set
            
            this.currentUserSubject.next(null!);
            
            resolve(); // Selesaikan Promise setelah logika logout selesai
        }).then(() => {
            // Jalankan refresh halaman setelah logout berhasil
            this.refreshToken();
        });
    }

    /**
     * Refresh token or data after logout
     */
    private refreshToken() {
        // Tambahkan logika refresh token di sini jika diperlukan
    
        // Lakukan refresh halaman tanpa delay setelah logout
        window.location.reload();
    }

    /**
     * Returns the current user
     */
    public currentUser(): any {
        return getFirebaseBackend()!.getAuthenticatedUser();
    }

    /**
     * Reset password
     * @param email email
     */
    resetPassword(email: string) {
        return getFirebaseBackend()!.forgetPassword(email).then((response: any) => {
            const message = response.data;
            return message;
        });
    }

}
