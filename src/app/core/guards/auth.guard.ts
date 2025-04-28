import { Injectable } from "@angular/core";
import {
  Router,
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from "@angular/router";

// Auth Services
import { AuthenticationService } from "../services/auth.service";
import { AuthfakeauthenticationService } from "../services/authfake.service";
import { environment } from "../../../environments/environment";

@Injectable({ providedIn: "root" })
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private authFackservice: AuthfakeauthenticationService
  ) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    // Get GodocUser from localStorage
    const GodocUserString = localStorage.getItem("GodocUser");

    // Check if GodocUser exists
    if (GodocUserString) {
      const GodocUser = JSON.parse(GodocUserString);
      // Check user role
      if (GodocUser.role === "User") {
        return true;
      }
      // For Admin role, allow access to all routes
      return true;
    }

    // Not logged in so redirect to login page with the return url
    this.router.navigate(["/auth/login"], {
      queryParams: { returnUrl: state.url },
    });
    return false;
  }

  //   isRouteAllowedForUser(url: string): boolean {
  //     // Define the routes allowed for User role
  //     const allowedRoutesForUser: string[] = [
  //       "/",
  //       "/list-proposed-changes",
  //       "/add-proposed-changes",
  //       "/document-number",
  //       "/form-document-number",
  //       "/approval",
  //       "/form-approval/:id",
  //     ];

  //     // Check if the requested route is in the allowedRoutesForUser array
  //     return allowedRoutesForUser.includes(url);
  //   }
}
