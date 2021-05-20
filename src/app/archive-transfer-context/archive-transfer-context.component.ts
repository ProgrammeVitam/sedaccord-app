import {Component, Input, OnInit} from '@angular/core';
import {ArchiveTransfer} from '../dtos/archive-transfer';
import {ReferentialService} from '../services/referential.service';
import {FormBuilder, FormGroup} from '@angular/forms';
import {ArchiveTransferService} from '../services/archive-transfer.service';
import {Router} from '@angular/router';
import {Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import {Agency} from '../dtos/referential';
import {ConfirmDialogComponent} from '../confirm-dialog/confirm-dialog.component';
import {MatDialog} from '@angular/material/dialog';
import {User} from '../dtos/user';
import {AuthService} from '../services/auth.service';

@Component({
  selector: 'app-archive-transfer-context',
  templateUrl: './archive-transfer-context.component.html',
  styleUrls: ['./archive-transfer-context.component.scss']
})
export class ArchiveTransferContextComponent implements OnInit {
  @Input() archiveTransfer!: ArchiveTransfer;

  contextForm1!: FormGroup;
  contextForm2!: FormGroup;
  saveButtonDisabled: boolean;

  currentUser!: User;
  agencies!: Agency[];
  $filteredOriginatingAgencies!: Observable<Agency[]>;
  $filteredSubmissionAgencies!: Observable<Agency[]>;

  constructor(
    private _router: Router,
    private _formBuilder: FormBuilder,
    private _referentialService: ReferentialService,
    private _archiveTransferService: ArchiveTransferService,
    private _authService: AuthService,
    private _dialog: MatDialog
  ) {
    this.saveButtonDisabled = true;
    this._getCurrentUser();
  }

  ngOnInit(): void {
    this.contextForm1 = this._formBuilder.group({
      name: [this.archiveTransfer.name],
      description: [this.archiveTransfer.description],
      startDate: [this.archiveTransfer.startDate],
      endDate: [this.archiveTransfer.endDate]
    });
    this.contextForm2 = this._formBuilder.group({
      originatingAgency: [this.archiveTransfer.originatingAgency],
      originatingAgencyDescription: [this.archiveTransfer.originatingAgency?.description],
      submissionAgency: [this.archiveTransfer.submissionAgency],
      submissionAgencyDescription: [this.archiveTransfer.submissionAgency?.description]
    });
    this._getAgencies();
    this.contextForm1.valueChanges.subscribe(_ => this.saveButtonDisabled = false);
    this.contextForm2.valueChanges.subscribe(_ => this.saveButtonDisabled = false);
  }

  displayFn(office: Agency): string {
    return office && office.name ? office.name : '';
  }

  autoFillOriginatingAgencyDescription(originatingAgency: Agency): void {
    this.contextForm2
      .patchValue({originatingAgencyDescription: this._findAgency(originatingAgency).description});
  }

  autoFillSubmissionAgencyDescription(submissionAgency: Agency): void {
    this.contextForm2
      .patchValue({submissionAgencyDescription: this._findAgency(submissionAgency).description});
  }

  onSubmit(): void {
    this.archiveTransfer.withName(this.contextForm1.value.name)
      .withDescription(this.contextForm1.value.description)
      .withStartDate(this.contextForm1.value.startDate)
      .withEndDate(this.contextForm1.value.endDate)
      .withOriginatingAgency({
        id: this.contextForm2.value.originatingAgency.id,
        name: this.contextForm2.value.originatingAgency.name,
        description: this.contextForm2.value.originatingAgencyDescription
      })
      .withSubmissionAgency({
        id: this.contextForm2.value.submissionAgency.id,
        name: this.contextForm2.value.submissionAgency.name,
        description: this.contextForm2.value.submissionAgencyDescription
      });
    this._archiveTransferService.updateArchiveTransfer(this.archiveTransfer).subscribe();
    this.saveButtonDisabled = true;
  }

  submitArchiveTransfer(): void {
    const dialogRef = this._dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirmer la soumission',
        content: `Confirmez-vous la soumission du versement ${this.archiveTransfer.id} ?`
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.archiveTransfer.share();
        this._archiveTransferService.updateArchiveTransfer(this.archiveTransfer)
          .subscribe(_ => this._router.navigate(['']));
      }
    });
  }

  private _getCurrentUser(): void {
    this.currentUser = this._authService.getCurrentUserValue();
  }

  private _getAgencies(): void {
    this._referentialService.getAgencies()
      .subscribe(agencies => {
        this.agencies = agencies;
        this.$filteredOriginatingAgencies = this.contextForm2.get('originatingAgency')!.valueChanges
          .pipe(
            startWith(''),
            map(value => typeof value === 'string' ? value : value.name),
            map(value => this._filterAgency(value))
          );
        this.$filteredSubmissionAgencies = this.contextForm2.get('submissionAgency')!.valueChanges
          .pipe(
            startWith(''),
            map(value => typeof value === 'string' ? value : value.name),
            map(value => this._filterAgency(value))
          );
      });

  }

  private _findAgency(agency: Agency): Agency {
    const foundAgency = this.agencies.find(a => a.id === agency.id);
    if (foundAgency) {
      return foundAgency;
    } else {
      throw new Error('Agency not found.');
    }
  }

  private _filterAgency(value: string): Agency[] {
    const filterValue = value.toLowerCase();
    return this.agencies.filter(agency => agency.name.toLowerCase().includes(filterValue));
  }
}
