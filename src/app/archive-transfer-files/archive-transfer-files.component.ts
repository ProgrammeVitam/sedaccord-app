import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ArchiveData, ArchiveDataUtils, ArchiveTransfer} from '../dtos/archive-transfer';
import {ReferentialService} from '../services/referential.service';
import {FormArray, FormBuilder, FormGroup} from '@angular/forms';
import {ComplexDialogService, FILE_DETAIL_SIDENAV_REF} from '../complex-dialog/complex-dialog.service';
import {FileDetailComponent} from '../file-detail/file-detail.component';
import {SelectionModel} from '@angular/cdk/collections';
import {Classification} from '../dtos/referential';
import {FileMetadata, FileUtil} from '../dtos/file';
import {FileTreeSelectionModel} from '../file-tree/file-tree.component';

@Component({
  selector: 'app-archive-transfer-files',
  templateUrl: './archive-transfer-files.component.html',
  styleUrls: ['./archive-transfer-files.component.scss']
})
export class ArchiveTransferFilesComponent implements OnInit {
  @Input() archiveTransfer!: ArchiveTransfer;
  @Output() formChangeEvent: EventEmitter<any>;
  @Output() updateEvent: EventEmitter<any>;

  classification: Classification;

  filesFormGroup!: FormGroup;
  selectedArchiveDataPackageIndex: number;
  selectionPath: string[];
  treeSelection: SelectionModel<FileTreeSelectionModel>;
  tableSelection: SelectionModel<FileMetadata>;

  constructor(
    private _formBuilder: FormBuilder,
    private _fileDetailDialogService: ComplexDialogService<FileDetailComponent>,
    private _referentialService: ReferentialService
  ) {
    this.classification = [];
    this.formChangeEvent = new EventEmitter<any>();
    this.updateEvent = new EventEmitter<any>();
    this.selectedArchiveDataPackageIndex = -1;
    this.selectionPath = [];
    this.treeSelection = new SelectionModel<FileTreeSelectionModel>(false);
    this.tableSelection = new SelectionModel<FileMetadata>(false);
  }

  get archiveDataPackageFormArray(): FormArray {
    return this.filesFormGroup.get('archiveDataPackageFormArray') as FormArray;
  }

  ngOnInit(): void {
    this._getClassification();
    this.filesFormGroup = this._formBuilder.group({
      archiveDataPackageFormArray: this._formBuilder.array([])
    });
    this.archiveTransfer.archiveDataPackages.forEach(archiveDataPackage => {
      this.archiveDataPackageFormArray.push(this._formBuilder.group({
        archiveData: [archiveDataPackage.archiveData],
        classificationItem: [archiveDataPackage.classificationItem]
      }));
    });
    this.filesFormGroup.valueChanges
      .subscribe(_ => this.formChangeEvent.emit(null));
  }

  updateArchiveTransfer(): void {
    let i = 1;
    this.archiveTransfer.archiveDataPackages = this.archiveDataPackageFormArray.value.map((archiveDataPackage: any) => {
      return {
        id: i++,
        name: archiveDataPackage.name,
        classificationItem: {
          id: archiveDataPackage.classificationItem?.id,
          name: archiveDataPackage.classificationItem?.name
        },
        archiveData: archiveDataPackage.archiveData
      };
    });
  }

  hasUnresolvedThread(archiveData: ArchiveData): boolean {
    return archiveData.flat()
      .some((fileMetadata: FileMetadata) => FileUtil.hasUnresolvedThread(fileMetadata));
  }

  hasComment(archiveData: ArchiveData): boolean {
    return archiveData.flat()
      .some((fileMetadata: FileMetadata) => FileUtil.getCommentCount(fileMetadata) > 0);
  }

  getDirectoryCount(archiveData: ArchiveData): number {
    return archiveData.flat()
      .filter(fileMetadata => fileMetadata.isDirectory).length;
  }

  getFileCount(archiveData: ArchiveData): number {
    return archiveData.flat()
      .filter(fileMetadata => !fileMetadata.isDirectory).length;
  }

  addPackage(): void {
    this.archiveDataPackageFormArray.push(this._formBuilder.group({
      archiveData: [[]],
      classificationItem: ['']
    }));
  }

  removePackage(index: number): void {
    this.archiveDataPackageFormArray.removeAt(index);
  }

  selectPackage(archiveDataPackageIndex: number): void {
    this.selectedArchiveDataPackageIndex = archiveDataPackageIndex;
    this.treeSelection.select({
      parents: [],
      children: ArchiveDataUtils.getRoots(this.archiveDataPackageFormArray.value[this.selectedArchiveDataPackageIndex].archiveData)
    });
  }

  selectElementFromTree(directoryAndFiles: FileTreeSelectionModel): void {
    this.selectionPath = directoryAndFiles.parents.map(fileMetadata => fileMetadata.name);
    this.treeSelection.select(directoryAndFiles);
  }

  selectElementFromTable(fileMetadata: FileMetadata): void {
    this.tableSelection.select(fileMetadata);
    const fileDetailSidenavRef = this._fileDetailDialogService.open(
      FileDetailComponent,
      FILE_DETAIL_SIDENAV_REF,
      {closeOnBackdropClick: true}
    );
    fileDetailSidenavRef.componentInstance!.fileData = fileMetadata;
    fileDetailSidenavRef.componentInstance!.updateEvent
      .subscribe(_ => this.updateEvent.emit(null));
  }

  private _getClassification(): void {
    this._referentialService.getClassification()
      .subscribe(classification => this.classification = classification);
  }
}
