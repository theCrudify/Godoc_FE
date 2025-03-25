import { Component, OnInit } from "@angular/core";
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";

// Login Auth
import { environment } from "../../../environments/environment";
import { AuthenticationService } from "../../core/services/auth.service";
// import { AuthfakeauthenticationService } from '../../../core/services/authfake.service';
import { first } from "rxjs/operators";
import { ToastService } from "./toast-service";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})

/**
 * Login Component
 */
export class LoginComponent implements OnInit {
  // Login Form
  loginForm!: UntypedFormGroup;
  submitted = false;
  fieldTextType!: boolean;
  error = "";
  returnUrl!: string;
  toast!: false;
  // set the current year
  year: number = new Date().getFullYear();

  constructor(
    private formBuilder: UntypedFormBuilder,
    private authenticationService: AuthenticationService,
    private router: Router,
    private route: ActivatedRoute,
    public toastService: ToastService
  ) {
    // redirect to home if already logged in
    if (this.authenticationService.currentUserValue) {
      this.router.navigate(["/"]);
    }
  }

  ngOnInit(): void {
    /**
     * Form Validation
     */
    if (localStorage.getItem("currentUser")) {
      this.router.navigate(["/"]);
    }
    this.loginForm = this.formBuilder.group({
      username: [null, [Validators.required, Validators.email]],
      password: [null, [Validators.required]],
    });
    // get return url from route parameters or default to '/'
    // this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  // convenience getter for easy access to form fields
  get f() {
    return this.loginForm.controls;
  }

  /**
   * Form submit
   */
  onSubmit() {
    this.submitted = true;

    // Login Api
    this.authenticationService
    .login(this.f["username"].value, this.f["password"].value)
    .subscribe((data: any) => {
      // Sesuaikan dengan struktur respons API yang baru
      if (data.token) {  // Mengecek apakah token ada dalam respons
        localStorage.setItem("currentUser", JSON.stringify(data.data)); // Menyimpan user data baru
        localStorage.setItem("token", data.token); // Menyimpan token dari respons baru
        this.router.navigate([""]);
        console.log("Form is valid, proceeding with login.");
        console.log("Login response: ", data);

        } else {
          this.toastService.show("Login failed, token missing.", {
            classname: "bg-danger text-white",
            delay: 15000,
          });
        }
      });

    // stop here if form is invalid
    if (this.loginForm.invalid) {
      return;
    } else {
    
    }
  }

  /**
   * Password Hide/Show
   */
  toggleFieldTextType() {
    this.fieldTextType = !this.fieldTextType;
  }
}
