import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AppService } from 'src/app/shared/service/app.service';
import { finalize } from 'rxjs/operators';

@Component({
    
  selector: 'app-otoapproval-modal',
  templateUrl: './otoapproval-modal.component.html',
  styleUrls: ['./otoapproval-modal.component.scss']
})
export class OtoApprovalModalComponent implements OnInit {
    @Input() id: number | undefined;
    approvalData: any[] = [];
  loading = false;

  constructor(
    public activeModal: NgbActiveModal,
    private service: AppService
  ) { }

  ngOnInit(): void {
    this.loadApprovalData();
  }

  loadApprovalData(): void {
    this.loading = true;
    
    this.service.get(`/approval-byID-authdoc/${this.id}`).pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: (response: any) => {
        this.approvalData = response.data || [];
        // Sort approval by level if needed
        this.approvalData.sort((a, b) => (a.level || 0) - (b.level || 0));
      },
      error: (error) => {
        this.handleError(error, 'Error fetching approval data');
        this.activeModal.dismiss();
      }
    });
  }

  handleError(error: any, defaultMessage: string): void {
    let errorMessage = defaultMessage;

    if (error.status === 0) {
      errorMessage = 'Cannot connect to server. Please ensure the server is running.';
    } else if (error.error) {
      if (error.error.message) {
        errorMessage = error.error.message;
      } else if (typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.error.errors) {
        errorMessage = Object.entries(error.error.errors)
          .map(([field, messages]) => {
            const messageArray = Array.isArray(messages) ? messages : [String(messages)];
            return `${field}: ${messageArray.join(', ')}`;
          })
          .join('\n');
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    console.error(errorMessage);
    // Tambahkan notifikasi error di sini jika diinginkan
  }
}