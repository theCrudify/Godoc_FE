import { Component, OnInit, OnDestroy } from "@angular/core";
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";
import { Router } from "@angular/router";
import { AuthenticationService } from "../../core/services/auth.service";
import { first } from "rxjs/operators";
import { ToastService } from "./toast-service";
import { interval, Subscription } from "rxjs";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})
export class LoginComponent implements OnInit, OnDestroy {
  // Login Form
  loginForm!: UntypedFormGroup;
  submitted = false;
  fieldTextType = false;
  error = "";
  loading = false;
  
  // Testimonial carousel
  testimonialIndex = 0;
  testimonials = [
    "Manajemen dokumen jadi lebih tertata dan efisien, memudahkan kolaborasi antar departemen.",
    "Tidak ada lagi dokumen yang tercecer atau terlewat dalam proses review dan approval.",
    "Semua riwayat dokumen tercatat dengan jelas dan mudah dilacak kapanpun."
  ];
  private testimonialSubscription!: Subscription;
  
  // App info
  appVersion = "1.0.0"; // Update sesuai dengan versi aplikasi Anda
  year: number = new Date().getFullYear();

  constructor(
    private formBuilder: UntypedFormBuilder,
    private authenticationService: AuthenticationService,
    private router: Router,
    public toastService: ToastService
  ) {
    // Redirect to home if already logged in
    if (this.authenticationService.GodocUserValue) {
      this.router.navigate(["/"]);
    }
  }

  ngOnInit(): void {
    // Check for existing session
    if (localStorage.getItem("GodocUser")) {
      this.router.navigate(["/"]);
    }
    
    // Initialize login form
    this.loginForm = this.formBuilder.group({
      username: ["", [Validators.required]],
      password: ["", [Validators.required]],
    });
    
    // Add animation class to body
    document.body.classList.add('auth-page');
    
    // Start testimonial rotation
    this.startTestimonialRotation();
  }
  
  ngOnDestroy(): void {
    // Remove animation class from body
    document.body.classList.remove('auth-page');
    
    // Clean up subscriptions
    if (this.testimonialSubscription) {
      this.testimonialSubscription.unsubscribe();
    }
  }
  
  /**
   * Start automatic testimonial rotation
   */
  private startTestimonialRotation(): void {
    this.testimonialSubscription = interval(5000).subscribe(() => {
      this.testimonialIndex = (this.testimonialIndex + 1) % this.testimonials.length;
    });
  }

  // Convenience getter for easy access to form fields
  get f() {
    return this.loginForm.controls;
  }

  /**
   * Form submit
   */
  onSubmit() {
    this.submitted = true;
    this.error = "";

    // Stop here if form is invalid
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;

    // Login Api
    this.authenticationService
      .login(this.f["username"].value, this.f["password"].value)
      .pipe(first())
      .subscribe({
        next: (data: any) => {
          if (data.token) {
            // Store user data and token
            localStorage.setItem("GodocUser", JSON.stringify(data.data));
            localStorage.setItem("token", data.token);
            
            // Redirect to dashboard
            this.router.navigate([""]);
            
            // Success notification (optional)
            this.toastService.show("Login berhasil!", {
              classname: "bg-success text-white",
              delay: 3000,
            });
          } else {
            this.handleLoginError();
          }
          this.loading = false;
        },
        error: (err) => {
          this.handleLoginError(err);
          this.loading = false;
        }
      });
  }
  
  /**
   * Handle login errors
   */
  private handleLoginError(err?: any) {
    console.error("Login error:", err);
    
    // Reset error first to trigger animation if it's shown again
    this.error = "";
    
    // Use setTimeout to ensure DOM update cycle completes for animation
    setTimeout(() => {
      this.error = "Kata sandi atau NIK salah.";
      
      // Vibrate mobile devices if supported
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }
      
      // Show toast notification
      this.toastService.show("Kata sandi atau NIK salah.", {
        classname: "bg-danger text-white",
        delay: 5000,
      });
    }, 10);
  }

  /**
   * Password Hide/Show
   */
  toggleFieldTextType() {
    this.fieldTextType = !this.fieldTextType;
  }
}