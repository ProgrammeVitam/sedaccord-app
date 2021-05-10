import {Component, Input, OnInit} from '@angular/core';
import {ArchiveDataUtils, ArchiveTransfer} from '../dtos/archive-transfer';
import {ReferentialService} from '../services/referential.service';
import {ArchiveTransferService} from '../services/archive-transfer.service';
import {FormArray, FormBuilder, FormGroup} from '@angular/forms';
import {ComplexDialogService, FILE_DETAIL_SIDENAV_REF} from '../complex-dialog/complex-dialog.service';
import {FileDetailComponent} from '../file-detail/file-detail.component';
import {SelectionModel} from '@angular/cdk/collections';
import {ClassificationItemNode} from '../dtos/referential';
import {FileMetadata} from '../dtos/file';
import {FileTreeSelectionModel} from '../file-tree/file-tree.component';

@Component({
  selector: 'app-archive-transfer-files',
  templateUrl: './archive-transfer-files.component.html',
  styleUrls: ['./archive-transfer-files.component.scss']
})
export class ArchiveTransferFilesComponent implements OnInit {
  @Input() archiveTransfer!: ArchiveTransfer;

  filesForm!: FormGroup;
  treeSelection: SelectionModel<FileTreeSelectionModel>;
  selectedArchiveDataPackageIndex: number;
  selectionPath: string[];
  tableSelection: SelectionModel<FileMetadata>;
  saveButtonDisabled: boolean;

  classification!: ClassificationItemNode[];

  constructor(
    private _formBuilder: FormBuilder,
    private _fileDetailDialogService: ComplexDialogService<FileDetailComponent>,
    private _referentialService: ReferentialService,
    private _archiveTransferService: ArchiveTransferService
  ) {
    this.treeSelection = new SelectionModel<FileTreeSelectionModel>(false);
    this.selectedArchiveDataPackageIndex = -1;
    this.selectionPath = [];
    this.tableSelection = new SelectionModel<FileMetadata>(false);
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
    this.treeSelection.select({
      parents: [],
      children: ArchiveDataUtils.getRoots(this.archiveDataPackages.value[this.selectedArchiveDataPackageIndex].archiveDataValues)
    });
  }

  onSelectFromTree(directoryAndFiles: FileTreeSelectionModel): void {
    this.treeSelection.select(directoryAndFiles);
    this.selectionPath = directoryAndFiles.parents.map(fileMetadata => fileMetadata.name);
  }

  onSelectFromTable(fileMetadata: FileMetadata): void {
    this.tableSelection.select(fileMetadata);
    const fileDetailSidenavRef = this._fileDetailDialogService.open(
      FileDetailComponent,
      FILE_DETAIL_SIDENAV_REF,
      {closeOnBackdropClick: true}
    );
    fileDetailSidenavRef.componentInstance!.fileData = fileMetadata;
    fileDetailSidenavRef.componentInstance!.updateEvent
      .subscribe((fileData: FileMetadata) => {
        fileMetadata.newName = fileData.newName;
        fileMetadata.comments = fileData.comments;
        fileMetadata.description = fileData.description;
        fileMetadata.startDate = fileData.startDate;
        fileMetadata.endDate = fileData.endDate;
        this._archiveTransferService.updateArchiveTransfer(this.archiveTransfer).subscribe();
      });
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
