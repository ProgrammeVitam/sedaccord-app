import {Component, Input, OnInit} from '@angular/core';
import {ArchiveTransfer, FileMetadata} from '../dtos/archive-transfer';
import {ReferentialService} from '../services/referential.service';
import {ArchiveTransferService} from '../services/archive-transfer.service';
import {FormArray, FormBuilder, FormGroup} from '@angular/forms';
import {ComplexDialogService, FILE_DETAIL_SIDENAV_REF} from '../complex-dialog/complex-dialog.service';
import {FileDetailComponent} from '../file-detail/file-detail.component';
import {SelectionModel} from '@angular/cdk/collections';
import {ClassificationItemNode} from '../dtos/referential';
import {Directory, FileNode} from '../dtos/file';

@Component({
  selector: 'app-archive-transfer-files',
  templateUrl: './archive-transfer-files.component.html',
  styleUrls: ['./archive-transfer-files.component.scss']
})
export class ArchiveTransferFilesComponent implements OnInit {
  @Input() archiveTransfer!: ArchiveTransfer;

  filesForm!: FormGroup;
  treeSelection: SelectionModel<FileNode>;
  selectedArchiveDataPackageIndex: number;
  selectionPath: string[];
  tableSelection: SelectionModel<FileNode>;
  saveButtonDisabled: boolean;

  classification!: ClassificationItemNode[];

  constructor(
    private _formBuilder: FormBuilder,
    private _fileDetailDialogService: ComplexDialogService<FileDetailComponent>,
    private _referentialService: ReferentialService,
    private _archiveTransferService: ArchiveTransferService
  ) {
    this.treeSelection = new SelectionModel<FileNode>(false);
    this.selectedArchiveDataPackageIndex = -1;
    this.selectionPath = [];
    this.tableSelection = new SelectionModel<FileNode>(false);
    this.saveButtonDisabled = true;
  }

  get archiveDataPackages(): FormArray {
    return this.filesForm.get('archiveDataPackages') as FormArray;
  }

  ngOnInit(): void {
    this._getClassification();
    this.filesForm = this._formBuilder.group({
      archiveDataPackages: this._formBuilder.array([])
    });
    this.archiveTransfer.archiveDataPackages.forEach(archiveDataPackage => {
      this.archiveDataPackages.push(this._formBuilder.group({
        archiveDataValues: [archiveDataPackage.archiveData],
        classificationItem: [archiveDataPackage.classificationItem]
      }));
    });
    this.filesForm.valueChanges.subscribe(_ => this.saveButtonDisabled = false);
  }

  onSelectPackage(archiveDataPackageIndex: number): void {
    this.selectedArchiveDataPackageIndex = archiveDataPackageIndex;
  }

  onSelectFromTree(file: FileNode): void {
    this.treeSelection.select(file);
  }

  onNavigateOnTree(filePath: string[]): void {
    this.selectionPath = filePath;
  }

  onSelectFromTable(file: FileNode): void {
    this.tableSelection.select(file);
    const fileDetailSidenavRef = this._fileDetailDialogService.open(
      FileDetailComponent,
      FILE_DETAIL_SIDENAV_REF,
      {closeOnBackdropClick: true}
    );
    fileDetailSidenavRef.componentInstance!.file = file;
  }

  onSubmit(): void {
    let i = 1;
    this.archiveTransfer.archiveDataPackages = this.archiveDataPackages.value.map((archiveDataPackage: any) => {
      return {
        id: i++,
        name: archiveDataPackage.name,
        classificationItem: {
          id: archiveDataPackage.classificationItem.id,
          name: archiveDataPackage.classificationItem.name
        },
        archiveData: archiveDataPackage.archiveDataValues
      };
    });
    this._archiveTransferService.updateArchiveTransfer(this.archiveTransfer).subscribe();
    this.saveButtonDisabled = true;
  }

  addPackage(): void {
    this.archiveDataPackages.push(this._formBuilder.group({
      archiveDataValues: [[]],
      classificationItem: ['']
    }));
  }

  removePackage(index: number): void { // TODO
    this.archiveDataPackages.removeAt(index);
  }

  listFiles(file: FileNode): FileNode[] {
    if (file.isDirectory) {
      return (file as Directory).children || [];
    }
    return [];
  }

  getDirectoryCount(archiveDataValues: FileMetadata[]): number {
    return archiveDataValues.flat().filter(file => file.isDirectory).length;
  }

  getFileCount(archiveDataValues: FileMetadata[]): number {
    return archiveDataValues.flat().filter(file => !file.isDirectory).length;
  }

  private _getClassification(): void {
    this._referentialService.getClassification()
      .subscribe(classification => this.classification = classification);
  }
}
