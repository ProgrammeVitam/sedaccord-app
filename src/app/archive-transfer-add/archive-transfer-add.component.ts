import {AfterViewInit, Component, EventEmitter, Inject, OnInit, Output} from '@angular/core';
import {FormArray, FormBuilder, FormGroup} from '@angular/forms';
import {ADD_DIALOG_REF, DialogReference} from '../complex-dialog/complex-dialog.service';
import {ArchiveDataPackage, ArchiveTransfer, FileMetadata} from '../dtos/archive-transfer';
import {ReferentialService} from '../services/referential.service';
import {ArchiveTransferService} from '../services/archive-transfer.service';
import {Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import {Agency, ClassificationItemNode} from '../dtos/referential';
import {FilePackage} from '../file-drop-input-control/file-drop-input-control.component';

@Component({
  selector: 'app-archive-transfer-add',
  templateUrl: './archive-transfer-add.component.html',
  styleUrls: ['./archive-transfer-add.component.scss']
})
export class ArchiveTransferAddComponent implements OnInit, AfterViewInit {
  @Output() addEvent: EventEmitter<ArchiveTransfer>;

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
  archiveTransferFormWrapper!: FormGroup;
  progressValue = 1;
  okDisabled = true;

  classification!: ClassificationItemNode[];
  agencies!: Agency[];
  $filteredOriginatingAgencies!: Observable<Agency[]>;
  $filteredSubmissionAgencies!: Observable<Agency[]>;

  // Workaround for angular component issue #13870
  disableAnimation = true;

  constructor(
    @Inject(ADD_DIALOG_REF) private _dialogRef: DialogReference<ArchiveTransferAddComponent>,
    private _formBuilder: FormBuilder,
    private _referentialService: ReferentialService,
    private _archiveTransferService: ArchiveTransferService
  ) {
    this._getClassification();
    this.addEvent = new EventEmitter<ArchiveTransfer>();
  }

  get archiveTransferForm(): FormArray {
    return this.archiveTransferFormWrapper.get('archiveTransferForm') as FormArray;
  }

  get archiveDataPackages(): FormArray {
    return this.archiveTransferForm.at(0).get('archiveDataPackages') as FormArray;
  }

  ngOnInit(): void {
    this.archiveTransferFormWrapper = this._formBuilder.group({
      archiveTransferForm: this._formBuilder.array([
        this._formBuilder.group({
          archiveDataPackages: this._formBuilder.array([])
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
    this._getAgencies();
  }

  ngAfterViewInit(): void {
    // timeout required to avoid the dreaded 'ExpressionChangedAfterItHasBeenCheckedError'
    setTimeout(() => (this.disableAnimation = false));
  }

  displayFn(office: Agency): string {
    return office && office.name ? office.name : '';
  }

  addPackage(): void {
    this.archiveDataPackages.push(this._formBuilder.group({
      archiveDataValues: [[]],
      classificationItem: ['']
    }));
  }

  removePackage(index: number): void {
    this.archiveDataPackages.removeAt(index);
  }

  autoFillOriginatingAgencyDescription(originatingAgency: Agency): void {
    this.archiveTransferForm.at(2)
      .patchValue({originatingAgencyDescription: this._findAgency(originatingAgency).description});
  }

  autoFillSubmissionAgencyDescription(submissionAgency: Agency): void {
    this.archiveTransferForm.at(2)
      .patchValue({submissionAgencyDescription: this._findAgency(submissionAgency).description});
  }

  onCancel(): void {
    this._dialogRef.close();
  }

  onSubmit(): void {
    const archiveTransfer = new ArchiveTransfer()
      .withName(this.archiveTransferForm.at(1).value.name)
      .withDescription(this.archiveTransferForm.at(1).value.description)
      .withStartDate(this.archiveTransferForm.at(1).value.startDate)
      .withEndDate(this.archiveTransferForm.at(1).value.endDate)
      .withOriginatingAgency({
        id: this.archiveTransferForm.at(2).value.originatingAgency.id,
        name: this.archiveTransferForm.at(2).value.originatingAgency.name,
        description: this.archiveTransferForm.at(2).value.originatingAgencyDescription
      }).withSubmissionAgency({
        id: this.archiveTransferForm.at(2).value.submissionAgency.id,
        name: this.archiveTransferForm.at(2).value.submissionAgency.name,
        description: this.archiveTransferForm.at(2).value.submissionAgencyDescription
      }).withArchiveDataPackages(this._buildArchiveDataPackages(this.archiveDataPackages.value));
    this.addEvent.emit(archiveTransfer);
    this._spin();
  }

  onOk(): void {
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
        this.$filteredOriginatingAgencies = this.archiveTransferForm.at(2).get('originatingAgency')!.valueChanges
          .pipe(
            startWith(''),
            map(value => typeof value === 'string' ? value : value.name),
            map(value => this._filterAgency(value))
          );
        this.$filteredSubmissionAgencies = this.archiveTransferForm.at(2).get('submissionAgency')!.valueChanges
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

  private _buildArchiveDataPackages(archiveDataPackageValues: any[]): ArchiveDataPackage[] {
    return archiveDataPackageValues
      .map((archiveDataPackageValue: any, index: number) => {
        return {
          id: index,
          name: archiveDataPackageValue.name,
          classificationItem: {
            id: archiveDataPackageValue.classificationItem.id,
            name: archiveDataPackageValue.classificationItem.name
          },
          archiveData: this._buildArchiveData(archiveDataPackageValue.archiveDataValues)
        };
      });
  }

  private _buildArchiveData(archiveDataValues: FilePackage[]): FileMetadata[][] {
    return archiveDataValues
      .map((filePackage: FilePackage) => {
        const directoryMetadata = filePackage.directories.map((directory: string) => {
          return {
            isDirectory: true,
            name: directory.split('/').pop()!,
            path: directory,
            creationDate: new Date(), // TODO update it backend side
            lastModificationDate: new Date(), // TODO update it backend side
            size: 0 // TODO update it backend side
          };
        });
        const fileMetadata = filePackage.files.map((file: File) => {
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

  private _spin(): void {
    const intervalId = setInterval((_: any) => {
      if (this.progressValue >= 100) {
        this.okDisabled = false;
        clearInterval(intervalId);
      } else {
        this.progressValue++;
      }
    }, 20);
  }
}
