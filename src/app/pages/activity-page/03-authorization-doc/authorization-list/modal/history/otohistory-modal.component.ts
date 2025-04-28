import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AppService } from 'src/app/shared/service/app.service';
import { finalize } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

@Component({

    selector: 'app-otohistory-modal',
    templateUrl: './otohistory-modal.component.html',
    styleUrls: ['./otohistory-modal.component.scss']
})
export class OtoHistoryModalComponent implements OnInit {
    @Input() id: number | undefined;
    historyData: any[] = [];
    loading = false;

    constructor(
        public activeModal: NgbActiveModal,
        private service: AppService
    ) { }

    ngOnInit(): void {
        this.loadHistoryData();
    }

    loadHistoryData(): void {
        this.loading = true;
      
        this.service.get(`/history-byID-authdoc/${this.id}`).pipe(
          finalize(() => this.loading = false)
        ).subscribe({
          next: (response: any) => {
            this.historyData = (response.data || []).map((item: any) => ({
              ...item,
              status: item.status?.toLowerCase().trim() // normalisasi status
            }));
      
            // Sort by date
            this.historyData.sort((a, b) => {
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
          },
          error: (error) => {
            this.handleError(error, 'Error fetching history data');
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