import {Component, Input, OnInit} from '@angular/core';
import {ArchiveTransfer, ClassificationItemNode} from '../dtos/archive-transfer';
import {Directory, FileNode} from '../dtos/file';
import {RepositoryService} from '../services/repository.service';
import {ArchiveTransferService} from '../services/archive-transfer.service';
import {FormArray, FormBuilder, FormGroup} from '@angular/forms';
import {ComplexDialogService, FILE_DETAIL_SIDENAV_REF} from '../complex-dialog/complex-dialog.service';
import {FileDetailComponent} from '../file-detail/file-detail.component';
import {SelectionModel} from '@angular/cdk/collections';

@Component({
  selector: 'app-archive-transfer-files',
  templateUrl: './archive-transfer-files.component.html',
  styleUrls: ['./archive-transfer-files.component.scss']
})
export class ArchiveTransferFilesComponent implements OnInit {
  @Input() archiveTransfer: ArchiveTransfer;

  filesForm: FormGroup;
  treeSelection: SelectionModel<FileNode>;
  tableSelection: SelectionModel<FileNode>;
  matBadgeHidden: boolean;

  classification: ClassificationItemNode[];

  constructor(
    private _formBuilder: FormBuilder,
    private _fileDetailDialogService: ComplexDialogService<FileDetailComponent>,
    private _repositoryService: RepositoryService,
    private _archiveTransferService: ArchiveTransferService
  ) {
    this.treeSelection = new SelectionModel<FileNode>(false);
    this.tableSelection = new SelectionModel<FileNode>(false);
    this.matBadgeHidden = true;
  }

  get archiveDataPackages(): FormArray {
    return this.filesForm.get('archiveDataPackages') as FormArray;
  }

  ngOnInit(): void {
    this.getClassification();
    this.filesForm = this._formBuilder.group({
      archiveDataPackages: this._formBuilder.array([])
    });
    this.archiveTransfer.archiveDataPackages.forEach(archiveDataPackage => {
      this.archiveDataPackages.push(this._formBuilder.group({
        data: [archiveDataPackage.fileTreeData],
        classificationItem: [archiveDataPackage.classificationItem]
      }));
    });
    this.filesForm.valueChanges.subscribe(_ => this.matBadgeHidden = false);
  }

  onSelectFromTree(file: FileNode): void {
    this.treeSelection.select(file);
  }

  onSelectFromTable(file: FileNode): void {
    this.tableSelection.select(file);
    const fileDetailSidenavRef = this._fileDetailDialogService.open(
      FileDetailComponent,
      FILE_DETAIL_SIDENAV_REF,
      {closeOnBackdropClick: true}
    );
    fileDetailSidenavRef.componentInstance.file = this.tableSelection.hasValue() ?
      this.tableSelection.selected[0] : null;
  }

  onSubmit(): void {
    let i = 1;
    this.archiveDataPackages.value.forEach(archiveDataPackage => {
      this.archiveTransfer.addOrUpdatePackage(i, archiveDataPackage.name, {
        id: archiveDataPackage.classificationItem.id,
        name: archiveDataPackage.classificationItem.name
      }, archiveDataPackage.data);
      i++;
    });
    this._archiveTransferService.updateArchiveTransfer(this.archiveTransfer).subscribe(); // TODO emit
    this.matBadgeHidden = true;
  }

  addPackage(): void {
    this.archiveDataPackages.push(this._formBuilder.group({
      data: [[]],
      classificationItem: ['']
    }));
  }

  deletePackage(): void {
    // TODO
  }

  listFiles(file: FileNode): FileNode[] {
    if (file.isDirectory) {
      return (file as Directory).children || [];
    }
    return [];
  }

  private getClassification(): void {
    this._repositoryService.getClassification()
      .subscribe(classification => this.classification = classification);
  }
}
