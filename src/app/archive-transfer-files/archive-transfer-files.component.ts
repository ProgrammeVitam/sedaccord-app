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
  @Input() archiveTransfer!: ArchiveTransfer;

  filesForm!: FormGroup;
  treeSelection: SelectionModel<FileNode>;
  tableSelection: SelectionModel<FileNode>;
  saveButtonDisabled: boolean;

  classification!: ClassificationItemNode[];

  constructor(
    private _formBuilder: FormBuilder,
    private _fileDetailDialogService: ComplexDialogService<FileDetailComponent>,
    private _repositoryService: RepositoryService,
    private _archiveTransferService: ArchiveTransferService
  ) {
    this.treeSelection = new SelectionModel<FileNode>(false);
    this.tableSelection = new SelectionModel<FileNode>(false);
    this.saveButtonDisabled = true;
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
    this.filesForm.valueChanges.subscribe(_ => this.saveButtonDisabled = false);
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
    if (this.tableSelection.hasValue()) {
      fileDetailSidenavRef.componentInstance!.file = this.tableSelection.selected[0];
    }
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
        fileTreeData: archiveDataPackage.data
      };
    });
    this._archiveTransferService.updateArchiveTransfer(this.archiveTransfer).subscribe(); // TODO emit
    this.saveButtonDisabled = true;
  }

  addPackage(): void {
    this.archiveDataPackages.push(this._formBuilder.group({
      data: [[]],
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

  private getClassification(): void {
    this._repositoryService.getClassification()
      .subscribe(classification => this.classification = classification);
  }
}
