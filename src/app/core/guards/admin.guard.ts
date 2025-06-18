// src/app/core/guards/admin.guard.ts

import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { TokenStorageService } from '../services/token-storage.service';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  
  constructor(
    private tokenService: TokenStorageService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    
    const currentUser = this.tokenService.getUser();
    
    if (!currentUser) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    // Check user role - bisa dari user_role atau dari role.role_name
    const userRole = currentUser.user_role || currentUser.role?.role_name;
    const adminRoles = ['admin', 'Admin', 'Super Admin'];

    if (adminRoles.includes(userRole)) {
      return true;
    }

    // Jika bukan admin, tampilkan pesan dan redirect
    Swal.fire({
      icon: 'error',
      title: 'Akses Ditolak',
      text: 'Anda tidak memiliki akses ke halaman ini. Halaman ini khusus untuk Admin.',
      confirmButtonText: 'OK',
      confirmButtonColor: '#dc3545'
    }).then(() => {
      // Redirect ke halaman sebelumnya atau dashboard
      this.router.navigate(['/dashboard']);
    });

    return false;
  }
}