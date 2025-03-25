import { Injectable, Inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import swal from 'sweetalert2';
import { Router } from '@angular/router';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { DatePipe, Location } from '@angular/common';
import { environment } from 'src/environments/environment';
declare var $: any;
import Swal from 'sweetalert2';

@Injectable()
export class AppService {
  public interval = [];
  private Token: any;
  private appversion = '';
  private httpOption: any;
  private httpOptionFile: any;
  constructor(
    protected http: HttpClient,
    protected router: Router,
    public datepipe: DatePipe,
    private location: Location
  ) {
    let sessionToken = localStorage.getItem('token');
    // console.info("sessionToken: ", sessionToken)

    if (sessionToken != null) {
      this.Token = sessionToken;
    } else {
      this.Token = '';
    }
    // console.info("ini token: ", this.Token);

    this.httpOption = new HttpHeaders({
      'Content-Type': 'application/json',
      "Authorization": `application/json ${this.Token}`,
    });
    this.httpOptionFile = new HttpHeaders({
      authorization: this.Token,
    });

    let contentType = "content";
    let auth = "token";
    let gabungan = `${contentType} ${auth}`;
    let splitToken = gabungan.split(" ");
    // console.info("ini httpOption: ", this.httpOption);
  }

  // HTTP Method
  get(url: any): Observable<any> {
    return this.http
      .get<any>(environment.apiUrl + url, {
        headers: this.httpOption
      })
      .pipe(catchError(this.handleError));
  }


  postFile(url: any, data: any): Observable<any> {
    console.log('Sending file to:', environment.apiUrl + url);
    console.log('Data to be uploaded:', data);
    console.log('HTTP options:', this.httpOptionFile);
  
    return this.http
      .post(environment.apiUrl + url, data, this.httpOptionFile)
      .pipe(catchError(this.handleError));
  }
  

  put(url: any, data: any): Observable<any> {
    // Tambahkan log untuk debugging
    console.log('PUT Request URL:', environment.apiUrl + url);
    console.log('Data being sent:', data);
    console.log('Headers:', this.httpOption);
    
    return this.http
      .put<any>(environment.apiUrl + url, data, {
        headers: this.httpOption,
      })
      .pipe(catchError(this.handleError));
  }
  

  post(url: any, data: any): Observable<any> {
    return this.http
      .post<any>(environment.apiUrl + url, data, {
        headers: this.httpOption,
      })
      .pipe(catchError(this.handleError));
  }

  delete(url: any): Observable<any> {
    return this.http
      .delete<any>(environment.apiUrl + url, {
        headers: this.httpOption
      })
      .pipe(catchError(this.handleError));
  }

  
  // End HTTP Method

  getAutoCompleteEmployee(term: any): Observable<any> {
    if (term == '' || term == null) {
      term = '0';
    }
    return this.http
      .get<any>(environment.apiUrl + '/master/autocomplete-employee/' + term, {
        headers: this.httpOption,
      })
      .pipe(catchError(this.handleError));
  }

  // Sweet Alert
  successMessage(title: any, body: any) {
    Swal.fire({
      title: title,
      text: body,
      icon: 'success',
    });
  }

  errorMessage(title: any, body: any) {
    Swal.fire({
      title: title,
      text: body,
      icon: 'error',
    });
  }

  warningMessage(title: any, body: any) {
    Swal.fire({
      title: title,
      text: body,
      icon: 'warning',
    });
  }
  // End Sweet Alert

  checkAvailabilityAuthorization(username: any) {
    return this.http.get(
      environment.apiUrl + '/master/authorization-by-code/' + username,
      {
        headers: this.httpOption,
      }
    );
  }

  checkAvailabilityProduct(code: any) {
    return this.http.get(environment.apiUrl + `/master/products/code/${code}`, {
      headers: this.httpOption,
    });
  }
  checkAvailabilityLine(line_code: any, plant_code: any) {
    return this.http.get(
      environment.apiUrl + `/master/lines/code/${line_code}/${plant_code}`,
      {
        headers: this.httpOption,
      }
    );
  }

  url(): string {
    console.log(environment.apiUrl);
    return environment.apiUrl;
  }

  userRole(role: any) {
    if (role == 1) {
      return 'SUPERADMIN';
    } else if (role == 2) {
      return 'ADMIN';
    } else if (role == 3) {
      return 'USER';
    } else {
      return 'UNASSIGNED ROLE';
    }
  }

  assignRole(role: any) {
    if (role == '1') {
      return '<span class="badge rounded-pill text-bg-primary">Superadmin</span>';
    } else if (role == '2') {
      return '<span class="badge rounded-pill text-bg-secondary">Admin</span>';
    } else if (role == '3') {
      return '<span class="badge rounded-pill text-bg-success">User</span>';
    } else {
      return 'Unassign Role';
    }
  }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error('An error occurred:', error.error.message);
    } else {
      console.error(
        `Backend returned code ${error.status}, ` + `body was: ${error.error}`
      );
    }
    return throwError('Something bad happened; please try again later.');
  }
}
