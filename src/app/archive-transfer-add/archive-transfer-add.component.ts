import {AfterViewInit, Component, EventEmitter, Inject, OnInit, Output, ViewChild} from '@angular/core';
import {FormArray, FormBuilder, FormGroup} from '@angular/forms';
import {ADD_DIALOG_REF, DialogReference} from '../complex-dialog/complex-dialog.service';
import {ArchiveDataPackage, ArchiveTransfer, ClassificationItemNode, Office} from '../dtos/archive-transfer';
import {RepositoryService} from '../services/repository.service';
import {ArchiveTransferService} from '../services/archive-transfer.service';

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
      description: 'Vous pouvez ici rattacher vos archives à verser à des noeuds du plan de classement.' +
        ' Il vous est possible de créer différents ensembles chacun étant rattaché à un noeud différent'
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
  archiveTransferFormWrapper: FormGroup;
  progressValue = 1;
  okDisabled = true;

  classification: ClassificationItemNode[];
  creators: Office[];
  transferringAgencies: Office[];

  archiveTransferId = 1234;

  // Workaround for angular component issue #13870
  disableAnimation = true;

  @ViewChild('stepper') stepper;

  constructor(
    @Inject(ADD_DIALOG_REF) private _dialogRef: DialogReference<ArchiveTransferAddComponent>,
    private _formBuilder: FormBuilder,
    private _repositoryService: RepositoryService,
    private _archiveTransferService: ArchiveTransferService
  ) {
    this._getClassification();
    this._getCreators();
    this._getTransferringAgencies();
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
          transferringAgencyId: [''],
          transferringAgencyDescription: [''],
          creatorId: [''],
          creatorDescription: ['']
        })
      ])
    });
    this.archiveTransferForm.at(2).get('creatorId').valueChanges
      .subscribe(value => this.archiveTransferForm.at(2)
        .patchValue({creatorDescription: this._findCreator(value).description}));
    this.archiveTransferForm.at(2).get('transferringAgencyId').valueChanges
      .subscribe(value => this.archiveTransferForm.at(2)
        .patchValue({transferringAgencyDescription: this._findTransferringAgency(value).description}));
  }

  ngAfterViewInit(): void {
    // timeout required to avoid the dreaded 'ExpressionChangedAfterItHasBeenCheckedError'
    setTimeout(() => (this.disableAnimation = false));
  }

  addPackage(): void {
    this.archiveDataPackages.push(this._formBuilder.group({
      data: [[]],
      classificationItem: ['']
    }));
  }

  onCancel(): void {
    this._dialogRef.close();
  }

  onSubmit(): void {
    const archiveTransfer = new ArchiveTransfer(0, this.archiveTransferForm.at(1).value.name); // TODO id
    archiveTransfer.description = this.archiveTransferForm.at(1).value.description;
    archiveTransfer.startDate = this.archiveTransferForm.at(1).value.startDate;
    archiveTransfer.endDate = this.archiveTransferForm.at(1).value.endDate;
    archiveTransfer.creator = {
      id: this.archiveTransferForm.at(2).value.creatorId,
      name: '', // TODO weird
      description: this.archiveTransferForm.at(2).value.creatorDescription
    };
    archiveTransfer.transferringAgency = {
      id: this.archiveTransferForm.at(2).value.transferringAgencyId,
      name: '', // TODO weird the same
      description: this.archiveTransferForm.at(2).value.transferringAgencyDescription
    };
    archiveTransfer.archiveDataPackages.push(...this.archiveDataPackages.value
      .map(archiveDataPackageValue => {
        const archiveDataPackage: ArchiveDataPackage = {
          id: 1, // TODO id
          name: archiveDataPackageValue.name,
          classificationItem: {
            id: archiveDataPackageValue.classificationItem.id,
            name: archiveDataPackageValue.classificationItem.name
          },
          fileTreeData: []
        };
        archiveDataPackageValue.data.forEach(file => { // TODO build tree
          archiveDataPackage.fileTreeData.push({
            isDirectory: true,
            name: file.name,
            startDate: null,
            endDate: file.lastModifiedDate,
            size: file.size
          });
        });
        return archiveDataPackage;
      }));
    this.addEvent.emit(archiveTransfer);
    this._spin();
  }

  onOk(): void {
    this._dialogRef.close();
  }

  private _getClassification(): void {
    this._repositoryService.getClassification()
      .subscribe(classification => this.classification = classification);
  }

  private _getCreators(): void {
    this._repositoryService.getCreators()
      .subscribe(creators => this.creators = creators);
  }

  private _getTransferringAgencies(): void {
    this._repositoryService.getTransferringAgencies()
      .subscribe(transferringAgencies => this.transferringAgencies = transferringAgencies);
  }

  private _findCreator(id: number): Office {
    return this.creators.find(creator => creator.id === id);
  }

  private _findTransferringAgency(id: number): Office {
    return this.transferringAgencies.find(transferringAgency => transferringAgency.id === id);
  }

  private _spin(): void {
    const intervalId = setInterval(_ => {
      if (this.progressValue >= 100) {
        this.okDisabled = false;
        clearInterval(intervalId);
      } else {
        this.progressValue++;
      }
    }, 20);
  }
}
