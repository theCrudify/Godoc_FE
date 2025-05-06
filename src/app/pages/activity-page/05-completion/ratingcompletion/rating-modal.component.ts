import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppService } from 'src/app/shared/service/app.service';
import { TokenStorageService } from 'src/app/core/services/token-storage.service';
import { finalize } from 'rxjs/operators';

@Component({
    selector: 'app-rating-modal',
    templateUrl: './rating-modal.component.html',
    styleUrls: ['./rating-modal.component.scss']
})
export class RatingModalComponent implements OnInit {
    @Input() handoverId: number = 0;
    @Input() docTitle: string = '';
    @Input() alreadyRated: boolean = false;

    ratingForm: FormGroup;
    currentRating: number = 0;
    hoverRating: number = 0;
    submitting: boolean = false;

    constructor(
        public activeModal: NgbActiveModal,
        private fb: FormBuilder,
        private service: AppService,
        private tokenStorage: TokenStorageService
    ) {
        this.ratingForm = this.fb.group({
            rating: [null, [Validators.required, Validators.min(1), Validators.max(5)]],
            review: ['', [Validators.required, Validators.minLength(3)]]
        });
    }

    ngOnInit(): void {}

    getStar(position: number): string {
        const rating = this.hoverRating || this.currentRating;

        if (position <= Math.floor(rating)) {
            return 'ri-star-fill';
        } else if (position === Math.ceil(rating) && rating % 1 !== 0) {
            return 'ri-star-half-fill';
        } else {
            return 'ri-star-line';
        }
    }

    setRating(rating: number): void {
        this.currentRating = rating;
        this.ratingForm.patchValue({ rating });
    }

    submitRating(): void {
        if (this.ratingForm.invalid) return;

        this.submitting = true;

        const user = this.tokenStorage.getUser();
        const payload = {
            rating: this.ratingForm.value.rating,
            review: this.ratingForm.value.review,
            auth_id: user?.auth_id
        };

        this.service.post(`/handover/${this.handoverId}/rate`, payload)
            .pipe(finalize(() => this.submitting = false))
            .subscribe({
                next: () => this.activeModal.close('success'),
                error: (error) => {
                    console.error('Rating submission failed', error);
                    this.activeModal.close('error');
                }
            });
    }
}
