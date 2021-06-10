import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ArchiveTransfer} from '../dtos/archive-transfer';
import {ReferentialService} from '../services/referential.service';
import {FormBuilder, FormGroup} from '@angular/forms';
import {Router} from '@angular/router';
import {Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import {Agency} from '../dtos/referential';

@Component({
  selector: 'app-archive-transfer-context',
  templateUrl: './archive-transfer-context.component.html',
  styleUrls: ['./archive-transfer-context.component.scss']
})
export class ArchiveTransferContextComponent implements OnInit {
  @Input() archiveTransfer!: ArchiveTransfer;
  @Output() formChangeEvent: EventEmitter<any>;

  contextForm1!: FormGroup;
  contextForm2!: FormGroup;

  agencies!: Agency[];
  $filteredOriginatingAgencies!: Observable<Agency[]>;
  $filteredSubmissionAgencies!: Observable<Agency[]>;

  constructor(
    private _router: Router,
    private _formBuilder: FormBuilder,
    private _referentialService: ReferentialService
  ) {
    this.formChangeEvent = new EventEmitter<any>();
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
    this.contextForm1.valueChanges.subscribe(_ => this.formChangeEvent.emit(null));
    this.contextForm2.valueChanges.subscribe(_ => this.formChangeEvent.emit(null));
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

  updateArchiveTransfer(): void {
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
