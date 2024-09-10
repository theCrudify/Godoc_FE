import {
  Component,
  EventEmitter,
  OnInit,
  TemplateRef,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import { AppService } from 'src/app/shared/service/app.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { debounceTime, switchMap } from 'rxjs';
import Swal from 'sweetalert2';
import { ngxLoadingAnimationTypes } from 'ngx-loading';
const PrimaryWhite = '#ffffff';
const SecondaryGrey = '#ccc';

@Component({
  selector: 'app-authorization',
  templateUrl: './authorization.component.html',
  styleUrls: ['./authorization.component.scss'],
})
export class AuthorizationComponent implements OnInit {
  public ngxLoadingAnimationTypes = ngxLoadingAnimationTypes;
  public loading = true;
  public primaryColour = PrimaryWhite;
  public secondaryColour = SecondaryGrey;
  public coloursEnabled = false;
  public loadingTemplate!: TemplateRef<any>;
  public config = {
    animationType: ngxLoadingAnimationTypes.none,
    primaryColour: this.primaryColour,
    secondaryColour: this.secondaryColour,
    tertiaryColour: this.primaryColour,
    backdropBorderRadius: '3px',
  };
  pageSize: number = 10;
  page: number = 1;
  searchTerm: string = '';
  totalRecords: any;
  totalPages: any;
  startIndex: number = 1;
  endIndex: number = this.pageSize;
  listData = [];

  currentUserLogin: any;
  breadCrumbItems!: Array<{}>;
  statusForm: any;
  dataMasterAuthorization = [];
  data = [];
  idEdit: any;

  // Select Employee Item
  typeaheadEmployee = new EventEmitter<string>();
  dataEmployee = [];

  // Select Role
  dataRole = [];

  // Select Site
  dataSite = [
    {
      label: 'Sukabumi',
      value: 'Sukabumi',
    },
    {
      label: 'Kejayan',
      value: 'Kejayan',
    },
  ];

  constructor(
    public service: AppService,
    private formBuilder: UntypedFormBuilder,
    private modal: NgbModal,
    private cd: ChangeDetectorRef
  ) {}

  // Build form group
  public formData = this.formBuilder.group({
    employee_code: [null, [Validators.required]],
    employee_name: [null, [Validators.required]],
    role: [null, [Validators.required]],
    site: [null],
  });

  // To make controlling the form easier
  get form() {
    return this.formData.controls;
  }

  @ViewChild('modalForm') modalForm: TemplateRef<any> | undefined;

  ngOnInit(): void {
    this.loading = true;
    const storedData = localStorage.getItem('currentUser');
    if (storedData !== null) {
      this.currentUserLogin = JSON.parse(storedData);
    }

    this.breadCrumbItems = [
      {
        label: 'Master Data',
      },
      {
        label: 'Authorization',
        active: true,
      },
    ];

    this.typeaheadEmployee
      .pipe(
        debounceTime(200),
        switchMap((term) => this.service.getAutoCompleteEmployee(term))
      )
      .subscribe(
        (items) => {
          if (items.success) {
            this.dataEmployee = items['data'];
            this.cd.markForCheck();
          }
        },
        (err) => {
          this.dataEmployee = [];
          this.cd.markForCheck();
        }
      );

    // Get data authorization
    if (atob(this.currentUserLogin.role) == '1') {
      this.service.get('/master/authorization').subscribe(
        (result) => {
          console.log(result);
          if (result.success) {
            this.loading = false;
            this.dataMasterAuthorization = result.data;
            this.listData = this.dataMasterAuthorization;
            this.totalRecords = this.listData.length;
            this.setPaginationData();
          } else {
            this.loading = false;
          }
        },
        (error) => {
            console.log(error);
          this.loading = false;
        }
      );
    } else {
      this.service
        .get('/master/authorization-by-site/' + this.currentUserLogin.site)
        .subscribe(
          (result) => {
            console.log(result);
            if (result.success) {
              this.loading = false;
              this.dataMasterAuthorization = result.data;
              this.listData = this.dataMasterAuthorization;
              this.totalRecords = this.listData.length;
              this.setPaginationData();
            }
          },
          (error) => {
              console.log(error);
            this.loading = false;
          }
        );
    }

    // Get data role
    this.service.get('/master/role').subscribe((result) => {
      if (result.success) {
        this.dataRole = result.data;
      }
    });
  }

  // Search data on table list
  onSearch() {
    if (!this.searchTerm) {
      this.listData = this.dataMasterAuthorization;
    } else {
      const searchTermLower = this.searchTerm.toLowerCase();
      this.listData = this.dataMasterAuthorization.filter(
        (data: { employee_code: string; employee_name: string }) => {
          return (
            data.employee_code
              .toString()
              .toLowerCase()
              .includes(searchTermLower) ||
            data.employee_name
              .toString()
              .toLowerCase()
              .includes(searchTermLower)
          );
        }
      );
    }
  }

  // Action add or edit
  onAction(status: any, data: any) {
    if (status == 'add') {
      this.statusForm = 'Add';
      this.formData.reset();
    } else if (status == 'edit') {
      this.statusForm = 'Edit';
      this.form['employee_code'].setValue(data.employee_code);
      this.form['employee_name'].setValue(data.employee_name);
      this.form['role'].setValue(Number(data.role));
      this.form['site'].setValue(data.site);
      this.idEdit = data.id;
      this.bindAutocompleteEmployee(data.employee_code);
    }
    this.modal.open(this.modalForm, {
      size: 'm',
      backdrop: 'static',
      centered: true,
    });
  }

  // Closing all modal
  onCloseModal() {
    this.modal.dismissAll();
    this.ngOnInit();
  }

  // Submit data to database (add or edit)
  onSubmit() {
    // Mark form as touched
    Object.keys(this.formData.controls).forEach((controlName) => {
      const control = this.formData.get(controlName);
      if (control) {
        control.markAsTouched();
      }
    });

    if (this.statusForm == 'Add') {
      // Add Data
      if (this.formData.valid) {
        // Check availability authorization data
        let username = this.form['employee_code'].value;
        this.service
          .checkAvailabilityAuthorization(username)
          .subscribe((data: any) => {
            if (data['success']) {
              this.service.warningMessage(
                'Warning!',
                'Employee data already exists'
              );
            } else {
              let data_login
              const storedData = localStorage.getItem('currentUser');
              if (storedData) {
                data_login = JSON.parse(storedData);
              }
              console.log(data_login)
              this.formData.value.created_by = data_login.nik
              this.service
                .post('/master/authorization', this.formData.value)
                .subscribe((data) => {
                  if (data.success) {
                    this.service.successMessage(
                      'Well Done!',
                      'Success add data'
                    );
                    this.modal.dismissAll();
                    this.ngOnInit();
                  } else {
                    this.service.errorMessage('Error!', 'Failed add data');
                    this.modal.dismissAll();
                    this.ngOnInit();
                  }
                });
            }
          });
      } else {
        this.service.warningMessage('Warning!', 'Form is invalid');
      }
    } else if (this.statusForm == 'Edit') {
      // Edit Data
      if (this.formData.valid) {
        this.service
          .put('/master/authorization/' + this.idEdit, this.formData.value)
          .subscribe((data) => {
            if (data.success) {
              this.service.successMessage('Well Done!', 'Success edit data');
              this.modal.dismissAll();
              this.ngOnInit();
            } else {
              this.service.errorMessage('Error!', 'Failed edit data');
              this.modal.dismissAll();
              this.ngOnInit();
            }
          });
      } else {
        this.service.warningMessage('Warning!', 'Form is invalid');
      }
    }
  }

  onDelete(id: any) {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#364574',
      cancelButtonColor: 'rgb(243, 78, 78)',
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (result.value) {
        this.service
          .put('/master/delete-authorization/' + id, '')
          .subscribe((data) => {
            if (data.success) {
              Swal.fire({
                title: 'Deleted!',
                text: 'Your data has been deleted.',
                confirmButtonColor: '#364574',
                icon: 'success',
              });
              this.ngOnInit();
            } else {
              this.service.errorMessage('Error!', 'Failed delete data');
              this.ngOnInit();
            }
          });
      }
    });
  }

  onSelectEmployeeCode(data: any) {
    if (data) {
      if (data.lg_location == 4) {
        this.form['site'].setValue('Kejayan');
      } else if (data.lg_location == 3) {
        this.form['site'].setValue('Sukabumi');
      }
      this.form['employee_name'].setValue(data.lg_name);
    }
  }

  setPaginationData() {
    this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
  }

  onPageSizeChange() {
    this.startIndex = 1;
    this.endIndex = this.pageSize;
  }

  getShowingText(): string {
    const startIndex = (this.page - 1) * this.pageSize + 1;
    const endIndex = Math.min(this.page * this.pageSize, this.totalRecords);
    return `Showing ${startIndex} - ${endIndex}`;
  }

  bindAutocompleteEmployee(data: any) {
    this.service.getAutoCompleteEmployee(data).subscribe(
      (items) => {
        if (items.success) {
          this.dataEmployee = items['data'];
          this.cd.markForCheck();
        }
      },
      (err) => {
        this.dataEmployee = [];
        this.cd.markForCheck();
      }
    );
  }
}
