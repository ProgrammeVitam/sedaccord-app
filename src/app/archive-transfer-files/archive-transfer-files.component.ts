import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ArchiveData, ArchiveDataUtils, ArchiveTransfer} from '../dtos/archive-transfer';
import {ReferentialService} from '../services/referential.service';
import {ArchiveTransferService} from '../services/archive-transfer.service';
import {FormArray, FormBuilder, FormGroup} from '@angular/forms';
import {ComplexDialogService, FILE_DETAIL_SIDENAV_REF} from '../complex-dialog/complex-dialog.service';
import {FileDetailComponent} from '../file-detail/file-detail.component';
import {SelectionModel} from '@angular/cdk/collections';
import {Classification} from '../dtos/referential';
import {FileMetadata} from '../dtos/file';
import {FileTreeSelectionModel} from '../file-tree/file-tree.component';
import {Router} from '@angular/router';

@Component({
  selector: 'app-archive-transfer-files',
  templateUrl: './archive-transfer-files.component.html',
  styleUrls: ['./archive-transfer-files.component.scss']
})
export class ArchiveTransferFilesComponent implements OnInit {
  @Input() archiveTransfer!: ArchiveTransfer;
  @Output() formChangeEvent: EventEmitter<any>;

  filesFormGroup!: FormGroup;
  treeSelection: SelectionModel<FileTreeSelectionModel>;
  selectedArchiveDataPackageIndex: number;
  selectionPath: string[];
  tableSelection: SelectionModel<FileMetadata>;

  classification!: Classification;

  constructor(
    private _router: Router,
    private _formBuilder: FormBuilder,
    private _fileDetailDialogService: ComplexDialogService<FileDetailComponent>,
    private _referentialService: ReferentialService,
    private _archiveTransferService: ArchiveTransferService
  ) {
    this.treeSelection = new SelectionModel<FileTreeSelectionModel>(false);
    this.selectedArchiveDataPackageIndex = -1;
    this.selectionPath = [];
    this.tableSelection = new SelectionModel<FileMetadata>(false);
    this.formChangeEvent = new EventEmitter<any>();
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
    this.filesFormGroup.valueChanges.subscribe(_ => this.formChangeEvent.emit(null));
  }

  hasUnresolvedThread(archiveData: ArchiveData): boolean {
    return archiveData.flat()
      .some((fileMetadata: FileMetadata) => this._hasUnresolvedThread(fileMetadata));
  }

  hasComment(archiveData: ArchiveData): boolean {
    return archiveData.flat()
      .some((fileMetadata: FileMetadata) => this._getCommentCount(fileMetadata) > 0);
  }

  onSelectPackage(archiveDataPackageIndex: number): void {
    this.selectedArchiveDataPackageIndex = archiveDataPackageIndex;
    this.treeSelection.select({
      parents: [],
      children: ArchiveDataUtils.getRoots(this.archiveDataPackageFormArray.value[this.selectedArchiveDataPackageIndex].archiveData)
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
        this._archiveTransferService.updateArchiveTransfer(this.archiveTransfer).subscribe();
      });
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

  getDirectoryCount(archiveData: ArchiveData): number {
    return archiveData.flat().filter(fileMetadata => fileMetadata.isDirectory).length;
  }

  getFileCount(archiveData: ArchiveData): number {
    return archiveData.flat().filter(fileMetadata => !fileMetadata.isDirectory).length;
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

  private _getClassification(): void {
    this._referentialService.getClassification()
      .subscribe(classification => this.classification = classification);
  }

  private _hasUnresolvedThread(fileMetadata: FileMetadata): boolean {
    return !!fileMetadata.comments && fileMetadata.comments.status === 'UNRESOLVED';
  }

  private _getCommentCount(fileMetadata: FileMetadata): number {
    return (fileMetadata.comments?.thread || []).length;
  }
}
