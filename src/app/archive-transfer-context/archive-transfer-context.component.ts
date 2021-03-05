import {Component, Input, OnInit} from '@angular/core';
import {ArchiveTransfer, Office} from '../dtos/archive-transfer';
import {RepositoryService} from '../services/repository.service';
import {FormBuilder, FormGroup} from '@angular/forms';
import {ArchiveTransferService} from '../services/archive-transfer.service';
import {Router} from '@angular/router';
import {Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';

@Component({
  selector: 'app-archive-transfer-context',
  templateUrl: './archive-transfer-context.component.html',
  styleUrls: ['./archive-transfer-context.component.scss']
})
export class ArchiveTransferContextComponent implements OnInit {
  @Input() archiveTransfer!: ArchiveTransfer;

  contextForm1!: FormGroup;
  contextForm2!: FormGroup;
  matBadgeHidden: boolean;

  creators!: Office[];
  transferringAgencies!: Office[];
  $filteredCreators!: Observable<Office[]>;
  $filteredTransferringAgencies!: Observable<Office[]>;

  constructor(
    private _router: Router,
    private _formBuilder: FormBuilder,
    private _repositoryService: RepositoryService,
    private _archiveTransferService: ArchiveTransferService
  ) {
    this.matBadgeHidden = true;
  }

  ngOnInit(): void {
    this.contextForm1 = this._formBuilder.group({
      name: [this.archiveTransfer.name],
      description: [this.archiveTransfer.description],
      startDate: [this.archiveTransfer.startDate],
      endDate: [this.archiveTransfer.endDate]
    });
    this.contextForm2 = this._formBuilder.group({
      creator: [this.archiveTransfer.creator],
      creatorDescription: [this.archiveTransfer.creator?.description],
      transferringAgency: [this.archiveTransfer.transferringAgency],
      transferringAgencyDescription: [this.archiveTransfer.transferringAgency?.description]
    });
    this._getCreators();
    this._getTransferringAgencies();
    this.contextForm1.valueChanges.subscribe(_ => this.matBadgeHidden = false);
    this.contextForm2.valueChanges.subscribe(_ => this.matBadgeHidden = false);
  }

  displayFn(office: Office): string {
    return office && office.name ? office.name : '';
  }

  autoFillCreatorDescription(creator: Office): void {
    this.contextForm2
      .patchValue({creatorDescription: this._findCreator(creator).description});
  }

  autoFillTransferringAgencyDescription(transferringAgency: Office): void {
    this.contextForm2
      .patchValue({transferringAgencyDescription: this._findTransferringAgency(transferringAgency).description});
  }

  onSubmit(): void {
    this.archiveTransfer.name = this.contextForm1.value.name;
    this.archiveTransfer.description = this.contextForm1.value.description;
    this.archiveTransfer.startDate = this.contextForm1.value.startDate;
    this.archiveTransfer.endDate = this.contextForm1.value.endDate;
    this.archiveTransfer.creator = {
      id: this.contextForm2.value.creator.id,
      name: this.contextForm2.value.creator.name,
      description: this.contextForm2.value.creatorDescription
    };
    this.archiveTransfer.transferringAgency = {
      id: this.contextForm2.value.transferringAgency.id,
      name: this.contextForm2.value.transferringAgency.name,
      description: this.contextForm2.value.transferringAgencyDescription
    };
    this._archiveTransferService.updateArchiveTransfer(this.archiveTransfer).subscribe(); // TODO emit
    this.matBadgeHidden = true;
  }

  submitArchiveTransfer(): void {
    // TODO
    this._router.navigate(['/']);
  }

  private _getCreators(): void {
    this._repositoryService.getCreators()
      .subscribe(creators => {
        this.creators = creators;
        this.$filteredCreators = this.contextForm2.get('creator')!.valueChanges
          .pipe(
            startWith(''),
            map(value => typeof value === 'string' ? value : value.name),
            map(value => this._filterCreator(value))
          );
      });
  }

  private _getTransferringAgencies(): void {
    this._repositoryService.getTransferringAgencies()
      .subscribe(transferringAgencies => {
        this.transferringAgencies = transferringAgencies;
        this.$filteredTransferringAgencies = this.contextForm2.get('transferringAgency')!.valueChanges
          .pipe(
            startWith(''),
            map(value => typeof value === 'string' ? value : value.name),
            map(value => this._filterTransferringAgency(value))
          );
      });

  }

  private _findCreator(creator: Office): Office {
    const foundCreator = this.creators.find(c => c.id === creator.id);
    if (foundCreator) {
      return foundCreator;
    } else {
      throw new Error('Creator not found.');
    }
  }

  private _findTransferringAgency(transferringAgency: Office): Office {
    const foundTransferringAgency = this.transferringAgencies.find(ta => ta.id === transferringAgency.id);
    if (foundTransferringAgency) {
      return foundTransferringAgency;
    } else {
      throw new Error('Transferring agency not found.');
    }
  }

  private _filterCreator(value: string): Office[] {
    const filterValue = value.toLowerCase();
    return this.creators.filter(creator => creator.name.toLowerCase().includes(filterValue));
  }

  private _filterTransferringAgency(value: string): Office[] {
    const filterValue = value.toLowerCase();
    return this.transferringAgencies.filter(transferringAgency => transferringAgency.name.toLowerCase().includes(filterValue));
  }
}
