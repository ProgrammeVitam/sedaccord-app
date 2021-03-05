import {AfterViewInit, Component, EventEmitter, Inject, OnInit, Output} from '@angular/core';
import {FormArray, FormBuilder, FormGroup} from '@angular/forms';
import {ADD_DIALOG_REF, DialogReference} from '../complex-dialog/complex-dialog.service';
import {ArchiveDataPackage, ArchiveTransfer, ClassificationItemNode, Office} from '../dtos/archive-transfer';
import {RepositoryService} from '../services/repository.service';
import {ArchiveTransferService} from '../services/archive-transfer.service';
import {Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';

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
  archiveTransferFormWrapper!: FormGroup;
  progressValue = 1;
  okDisabled = true;

  classification!: ClassificationItemNode[];
  creators!: Office[];
  transferringAgencies!: Office[];
  $filteredCreators!: Observable<Office[]>;
  $filteredTransferringAgencies!: Observable<Office[]>;

  archiveTransferId = 1234;

  // Workaround for angular component issue #13870
  disableAnimation = true;

  constructor(
    @Inject(ADD_DIALOG_REF) private _dialogRef: DialogReference<ArchiveTransferAddComponent>,
    private _formBuilder: FormBuilder,
    private _repositoryService: RepositoryService,
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
          creator: [''],
          creatorDescription: [''],
          transferringAgency: [''],
          transferringAgencyDescription: ['']
        })
      ])
    });
    this.addPackage();
    this._getCreators();
    this._getTransferringAgencies();
  }

  ngAfterViewInit(): void {
    // timeout required to avoid the dreaded 'ExpressionChangedAfterItHasBeenCheckedError'
    setTimeout(() => (this.disableAnimation = false));
  }

  displayFn(office: Office): string {
    return office && office.name ? office.name : '';
  }

  addPackage(): void {
    this.archiveDataPackages.push(this._formBuilder.group({
      data: [[]],
      classificationItem: ['']
    }));
  }

  removePackage(index: number): void {
    this.archiveDataPackages.removeAt(index);
  }

  autoFillCreatorDescription(creator: Office): void {
    this.archiveTransferForm.at(2)
      .patchValue({creatorDescription: this._findCreator(creator).description});
  }

  autoFillTransferringAgencyDescription(transferringAgency: Office): void {
    this.archiveTransferForm.at(2)
      .patchValue({transferringAgencyDescription: this._findTransferringAgency(transferringAgency).description});
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
      id: this.archiveTransferForm.at(2).value.creator.id,
      name: this.archiveTransferForm.at(2).value.creator.name,
      description: this.archiveTransferForm.at(2).value.creatorDescription
    };
    archiveTransfer.transferringAgency = {
      id: this.archiveTransferForm.at(2).value.transferringAgency.id,
      name: this.archiveTransferForm.at(2).value.transferringAgency.name,
      description: this.archiveTransferForm.at(2).value.transferringAgencyDescription
    };
    archiveTransfer.archiveDataPackages.push(...this.archiveDataPackages.value
      .map((archiveDataPackageValue: any) => {
        const archiveDataPackage: ArchiveDataPackage = {
          id: 1, // TODO id
          name: archiveDataPackageValue.name,
          classificationItem: {
            id: archiveDataPackageValue.classificationItem.id,
            name: archiveDataPackageValue.classificationItem.name
          },
          fileTreeData: []
        };
        archiveDataPackageValue.data.forEach((file: File) => { // TODO build tree
          archiveDataPackage.fileTreeData.push({
            isDirectory: true,
            name: file.name,
            startDate: new Date(file.lastModified), // FIXME
            endDate: new Date(file.lastModified),
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
      .subscribe(creators => {
        this.creators = creators;
        this.$filteredCreators = this.archiveTransferForm.at(2).get('creator')!.valueChanges
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
        this.$filteredTransferringAgencies = this.archiveTransferForm.at(2).get('transferringAgency')!.valueChanges
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
