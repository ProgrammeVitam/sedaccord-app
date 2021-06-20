import {AfterViewInit, Component, EventEmitter, Inject, Input, OnInit, Output} from '@angular/core';
import {FormArray, FormBuilder, FormGroup} from '@angular/forms';
import {ADD_DIALOG_REF, DialogReference} from '../complex-dialog/complex-dialog.service';
import {ArchiveData, ArchiveDataPackage, ArchiveTransfer} from '../dtos/archive-transfer';
import {ReferentialService} from '../services/referential.service';
import {Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import {Agency, Classification} from '../dtos/referential';
import {FileDropPackage} from '../file-drop-input-control/file-drop-input-control.component';
import {Router} from '@angular/router';
import {AuthService} from '../services/auth.service';

@Component({
  selector: 'app-archive-transfer-add',
  templateUrl: './archive-transfer-add.component.html',
  styleUrls: ['./archive-transfer-add.component.scss']
})
export class ArchiveTransferAddComponent implements OnInit, AfterViewInit {
  @Input() newArchiveTransferId: number | undefined;
  @Output() addEvent: EventEmitter<ArchiveTransfer>;

  classification: Classification;
  agencies: Agency[];
  $filteredOriginatingAgencies!: Observable<Agency[]>;
  $filteredSubmissionAgencies!: Observable<Agency[]>;

  steps = [
    {
      label: 'Rattachement au plan de classement',
      description: 'Il s\'agit de rattacher vos archives à verser à des noeuds du plan de classement.' +
        ' Vous pouvez créer différents ensembles chacun étant rattaché à un noeud différent'
    }, {
      label: 'Description générale du versement',
      description: 'La description générale de votre projet de versement permettra de contextualiser les archives que vous souhaitez verser.'
    }, {
      label: 'Informations sur les services versant et producteur',
      description: 'Vous pouvez ici attribuer des règles de gestion applicables à l\'ensemble de votre versement.'
    }, {
      label: 'Traitement des répertoires',
      description: 'Veuillez patienter pendant que le système effectue des opérations de vérification et de nettoyage sur vos répertoires.'
    }
  ];
  archiveTransferFormGroup!: FormGroup;
  progressValue = 1;

  // Workaround for angular component issue #13870
  disableAnimation = true;

  constructor(
    @Inject(ADD_DIALOG_REF) private _dialogRef: DialogReference<ArchiveTransferAddComponent>,
    private _router: Router,
    private _formBuilder: FormBuilder,
    private _referentialService: ReferentialService,
    private _authService: AuthService
  ) {
    this.addEvent = new EventEmitter<ArchiveTransfer>();
    this.classification = [];
    this.agencies = [];
  }

  get archiveTransferFormArray(): FormArray {
    return this.archiveTransferFormGroup.get('archiveTransferFormArray') as FormArray;
  }

  get archiveDataPackageFormArray(): FormArray {
    return this.archiveTransferFormArray.at(0).get('archiveDataPackageFormArray') as FormArray;
  }

  ngOnInit(): void {
    this.archiveTransferFormGroup = this._formBuilder.group({
      archiveTransferFormArray: this._formBuilder.array([
        this._formBuilder.group({
          archiveDataPackageFormArray: this._formBuilder.array([])
        }),
        this._formBuilder.group({
          name: [''],
          description: [''],
          startDate: [''],
          endDate: ['']
        }),
        this._formBuilder.group({
          originatingAgency: [''],
          originatingAgencyDescription: [''],
          submissionAgency: [''],
          submissionAgencyDescription: ['']
        })
      ])
    });
    this.addPackage();
    this._getClassification();
    this._getAgencies();
  }

  ngAfterViewInit(): void {
    // timeout required to avoid the dreaded 'ExpressionChangedAfterItHasBeenCheckedError'
    setTimeout(() => (this.disableAnimation = false));
  }

  getDisplayAgency(agency: Agency): string {
    return agency && agency.name ? agency.name : '';
  }

  autoFillOriginatingAgencyDescription(originatingAgency: Agency): void {
    this.archiveTransferFormArray.at(2)
      .patchValue({originatingAgencyDescription: this._findAgency(originatingAgency).description});
  }

  autoFillSubmissionAgencyDescription(submissionAgency: Agency): void {
    this.archiveTransferFormArray.at(2)
      .patchValue({submissionAgencyDescription: this._findAgency(submissionAgency).description});
  }

  addPackage(): void {
    this.archiveDataPackageFormArray.push(this._formBuilder.group({
      fileDropData: [[]],
      classificationItem: ['']
    }));
  }

  removePackage(index: number): void {
    this.archiveDataPackageFormArray.removeAt(index);
  }

  submit(): void {
    const archiveTransfer = new ArchiveTransfer(this._authService.getCurrentUserValue().id)
      .withName(this.archiveTransferFormArray.at(1).value.name)
      .withDescription(this.archiveTransferFormArray.at(1).value.description)
      .withStartDate(this.archiveTransferFormArray.at(1).value.startDate)
      .withEndDate(this.archiveTransferFormArray.at(1).value.endDate)
      .withOriginatingAgency({
        id: this.archiveTransferFormArray.at(2).value.originatingAgency.id,
        name: this.archiveTransferFormArray.at(2).value.originatingAgency.name,
        description: this.archiveTransferFormArray.at(2).value.originatingAgencyDescription
      }).withSubmissionAgency({
        id: this.archiveTransferFormArray.at(2).value.submissionAgency.id,
        name: this.archiveTransferFormArray.at(2).value.submissionAgency.name,
        description: this.archiveTransferFormArray.at(2).value.submissionAgencyDescription
      }).withArchiveDataPackages(this._buildArchiveDataPackages(this.archiveDataPackageFormArray.value));
    this.addEvent.emit(archiveTransfer);
  }

  validate(): void {
    this._router.navigate([`/detail/${this.newArchiveTransferId}`]);
    this._dialogRef.close();
  }

  cancel(): void {
    this._dialogRef.close();
  }

  private _getClassification(): void {
    this._referentialService.getClassification()
      .subscribe(classification => this.classification = classification);
  }

  private _getAgencies(): void {
    this._referentialService.getAgencies()
      .subscribe(agencies => {
        this.agencies = agencies;
        this.$filteredOriginatingAgencies = this._observeFilteredAgencies('originatingAgency');
        this.$filteredSubmissionAgencies = this._observeFilteredAgencies('submissionAgency');
      });
  }

  private _observeFilteredAgencies(agencyType: string): Observable<Agency[]> {
    return this.archiveTransferFormArray.at(2).get(agencyType)!.valueChanges
      .pipe(
        startWith(''),
        map(value => typeof value === 'string' ? value : value.name),
        map(value => this._filterAgency(value))
      );
  }

  private _filterAgency(value: string): Agency[] {
    return this.agencies.filter(agency => agency.name.toLowerCase().includes(value.toLowerCase()));
  }

  private _findAgency(agencyToFind: Agency): Agency {
    const foundAgency = this.agencies.find(agency => agency.id === agencyToFind.id);
    if (foundAgency) {
      return foundAgency;
    } else {
      throw new Error('Agency not found.');
    }
  }

  private _buildArchiveDataPackages(archiveDataPackageFormArrayValue: any[]): ArchiveDataPackage[] {
    return archiveDataPackageFormArrayValue
      .map((archiveDataPackage: any, index: number) => {
        return {
          name: archiveDataPackage.name,
          classificationItem: {
            id: archiveDataPackage.classificationItem.id,
            name: archiveDataPackage.classificationItem.name
          },
          archiveData: this._buildArchiveData(archiveDataPackage.fileDropData)
        };
      });
  }

  private _buildArchiveData(fileDropPackages: FileDropPackage[]): ArchiveData {
    return fileDropPackages
      .map(fileDropPackage => {
        const directoryMetadata = fileDropPackage.directories.map((directory: string) => {
          return {
            isDirectory: true,
            name: directory.split('/').pop()!,
            path: directory,
            creationDate: new Date(), // TODO update it backend side
            lastModificationDate: new Date(), // TODO update it backend side
            size: 0 // TODO update it backend side
          };
        });
        const fileMetadata = fileDropPackage.files.map((file: File) => {
          return {
            isDirectory: false,
            name: file.name,
            path: file.fullPath,
            creationDate: new Date(file.lastModified), // TODO update it backend side
            lastModificationDate: new Date(file.lastModified),
            size: file.size,
            format: '' // TODO update it backend side
          };
        });
        return [...directoryMetadata, ...fileMetadata];
      });
  }
}
