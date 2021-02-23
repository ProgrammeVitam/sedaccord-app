import {Component, Input, OnInit} from '@angular/core';
import {ArchiveTransfer, Office} from '../dtos/archive-transfer';
import {RepositoryService} from '../services/repository.service';
import {FormBuilder, FormGroup} from '@angular/forms';
import {ArchiveTransferService} from '../services/archive-transfer.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-archive-transfer-context',
  templateUrl: './archive-transfer-context.component.html',
  styleUrls: ['./archive-transfer-context.component.scss']
})
export class ArchiveTransferContextComponent implements OnInit {
  @Input() archiveTransfer: ArchiveTransfer;

  contextForm1: FormGroup;
  contextForm2: FormGroup;
  matBadgeHidden: boolean;

  creators: Office[];
  transferringAgencies: Office[];

  constructor(
    private _router: Router,
    private _formBuilder: FormBuilder,
    private _repositoryService: RepositoryService,
    private _archiveTransferService: ArchiveTransferService
  ) {
    this._getCreators();
    this._getTransferringAgencies();
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
      creatorId: [this.archiveTransfer.creator.id],
      creatorDescription: [this.archiveTransfer.creator.description],
      transferringAgencyId: [this.archiveTransfer.transferringAgency.id],
      transferringAgencyDescription: [this.archiveTransfer.transferringAgency.description]
    });
    this.contextForm2.get('creatorId').valueChanges
      .subscribe(value => this.contextForm2
        .patchValue({creatorDescription: this._findCreator(value).description}));
    this.contextForm2.get('transferringAgencyId').valueChanges
      .subscribe(value => this.contextForm2
        .patchValue({transferringAgencyDescription: this._findTransferringAgency(value).description}));
    this.contextForm1.valueChanges.subscribe(_ => this.matBadgeHidden = false);
    this.contextForm2.valueChanges.subscribe(_ => this.matBadgeHidden = false);
  }

  onSubmit(): void {
    this.archiveTransfer.name = this.contextForm1.value.name;
    this.archiveTransfer.description = this.contextForm1.value.description;
    this.archiveTransfer.startDate = this.contextForm1.value.startDate;
    this.archiveTransfer.endDate = this.contextForm1.value.endDate;
    this.archiveTransfer.creator.id = this.contextForm2.value.creatorId;
    this.archiveTransfer.creator.description = this.contextForm2.value.creatorDescription;
    this.archiveTransfer.transferringAgency.id = this.contextForm2.value.transferringAgencyId;
    this.archiveTransfer.transferringAgency.description = this.contextForm2.value.transferringAgencyDescription;
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
      });
  }

  private _getTransferringAgencies(): void {
    this._repositoryService.getTransferringAgencies()
      .subscribe(transferringAgencies => {
        this.transferringAgencies = transferringAgencies;
      });

  }

  private _findCreator(id: number): Office {
    return this.creators.find(creator => creator.id === id);
  }

  private _findTransferringAgency(id: number): Office {
    return this.transferringAgencies.find(transferringAgency => transferringAgency.id === id);
  }
}
