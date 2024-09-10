import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

// Login Auth
import { environment } from '../../../environments/environment';
import { AuthenticationService } from '../../core/services/auth.service';
import { AuthfakeauthenticationService } from '../../core/services/authfake.service';
import { first } from 'rxjs/operators';
import { ToastService } from './toast-service';
import { Store } from '@ngrx/store';
import { login } from 'src/app/store/Authentication/authentication.actions';
import { AppService } from 'src/app/shared/service/app.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})

/**
 * Login Component
 */
export class LoginComponent implements OnInit {

  // Login Form
  loginForm!: UntypedFormGroup;
  dataLogin: any;
  submitted = false;
  isLoading = false;
  fieldTextType!: boolean;
  error = '';
  returnUrl!: string;
  showNavigationArrows: any;
  toast!: false;

  // set the current year
  year: number = new Date().getFullYear();

  constructor(private formBuilder: UntypedFormBuilder,private authenticationService: AuthenticationService,private router: Router,
    private authFackservice: AuthfakeauthenticationService, private route: ActivatedRoute, public toastService: ToastService,
    private store: Store,
    public service: AppService) {
      // redirect to home if already logged in
      if (this.authenticationService.currentUserValue) {
        this.router.navigate(['/']);
      }
     }

  ngOnInit(): void {
    if(sessionStorage.getItem('currentUser')) {
      this.router.navigate(['/']);
    }
    /**
     * Form Validatyion
     */
     this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });
    // get return url from route parameters or default to '/'
    // this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }



  // convenience getter for easy access to form fields
  get f() { return this.loginForm.controls; }

  /**
   * Form submit
   */
   onSubmit() {
    this.submitted = true;

     // Login Api
    //  this.store.dispatch(login({ username: this.f['username'].value, password: this.f['password'].value }));

    this.isLoading = true
    // Login Api
    // Check whether employee data exists in the database
    this.authenticationService.login(this.f['username'].value, this.f['password'].value).subscribe((result:any) => {
      if(result.success){
        this.dataLogin = result.data
        localStorage.setItem('token', result.data.token);
        // Check whether the employee has authorization for the application
        this.authenticationService.loginApps(result.data.nik, result.data.token).subscribe((result:any) => { 
          if(result.success){
            this.dataLogin.role = btoa(result.data[0].role)
            this.dataLogin.site = result.data[0].site
            localStorage.setItem('currentUser', JSON.stringify(this.dataLogin));
            localStorage.setItem('toast', 'true');
            this.router.navigate(['/']).then((f) => {
              window.location.reload()
            });
          } else {
            this.isLoading = false
            this.service.warningMessage("Can't Login", 'Employees do not have authorization into the application')
          }        
        })
      } else {
        this.isLoading = false
        this.service.warningMessage("Can't Login",'Employee Data Not Found');
      }
    });

    // this.authenticationService.login(this.f['email'].value, this.f['password'].value).subscribe((data:any) => { 
    //   if(data.status == 'success'){
    //     sessionStorage.setItem('toast', 'true');
    //     sessionStorage.setItem('currentUser', JSON.stringify(data.data));
    //     sessionStorage.setItem('token', data.token);
    //     this.router.navigate(['/']);
    //   } else {
    //     this.toastService.show(data.data, { classname: 'bg-danger text-white', delay: 15000 });
    //   }
    // });

    // stop here if form is invalid
    // if (this.loginForm.invalid) {
    //   return;
    // } else {
    //   if (environment.defaultauth === 'firebase') {
    //     this.authenticationService.login(this.f['email'].value, this.f['password'].value).then((res: any) => {
    //       this.router.navigate(['/']);
    //     })
    //       .catch(error => {
    //         this.error = error ? error : '';
    //       });
    //   } else {
    //     this.authFackservice.login(this.f['email'].value, this.f['password'].value).pipe(first()).subscribe(data => {
    //           this.router.navigate(['/']);
    //         },
    //         error => {
    //           this.error = error ? error : '';
    //         });
    //   }
    // }
  }

  /**
   * Password Hide/Show
   */
   toggleFieldTextType() {
    this.fieldTextType = !this.fieldTextType;
  }

}
