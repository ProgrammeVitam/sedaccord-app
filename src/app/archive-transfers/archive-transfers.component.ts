import {Component, ViewChild} from '@angular/core';
import {ArchiveTransferAddComponent} from '../archive-transfer-add/archive-transfer-add.component';
import {ADD_DIALOG_REF, ComplexDialogService} from '../complex-dialog/complex-dialog.service';
import {ArchiveDataPackage, ArchiveTransfer} from '../dtos/archive-transfer';
import {ArchiveTransferService} from '../services/archive-transfer.service';
import {MatDialog} from '@angular/material/dialog';
import {ConfirmDialogComponent} from '../confirm-dialog/confirm-dialog.component';
import {MatListOption, MatSelectionList} from '@angular/material/list';
import {Router} from '@angular/router';
import {SipService} from '../services/sip.service';
import { saveAs } from 'file-saver';
import {HttpResponse} from '@angular/common/http';
import {FileMetadata} from '../dtos/file';

type SortValue = 'creationDate' | 'lastModificationDate';

@Component({
  selector: 'app-archive-transfers',
  templateUrl: './archive-transfers.component.html',
  styleUrls: ['./archive-transfers.component.scss']
})
export class ArchiveTransfersComponent {
  name = 'Caroline'; // TODO

  disabledDownload: boolean;
  loadingArchiveTransferId: number | null;

  archiveTransfers!: ArchiveTransfer[];

  @ViewChild('archiveTransferList') archiveTransferList!: MatSelectionList;

  constructor(
    private _router: Router,
    private _addDialogService: ComplexDialogService<ArchiveTransferAddComponent>,
    private _archiveTransferService: ArchiveTransferService,
    private _sipService: SipService,
    private _dialog: MatDialog
  ) {
    this._getArchiveTransfers();
    this.disabledDownload = true;
    this._sipService.isAvailable()
      .subscribe(response => this.disabledDownload = response.status !== 'UP');
    this.loadingArchiveTransferId = null;
  }

  _sortByLastModificationDate = (archiveTransfer1: ArchiveTransfer, archiveTransfer2: ArchiveTransfer) =>
    archiveTransfer2.lastModificationDate.getTime() - archiveTransfer1.lastModificationDate.getTime()
  _sortByCreationDate = (archiveTransfer1: ArchiveTransfer, archiveTransfer2: ArchiveTransfer) =>
    archiveTransfer2.creationDate.getTime() - archiveTransfer1.creationDate.getTime()

  sortArchiveTransfers(value: SortValue): void {
    switch (value) {
      case 'creationDate':
        this.archiveTransfers = this.archiveTransfers.sort(this._sortByCreationDate);
        break;
      case 'lastModificationDate':
        this.archiveTransfers = this.archiveTransfers.sort(this._sortByLastModificationDate);
        break;
      default:
        break;
    }
  }

  openAddDialog(): void {
    const addDialogRef = this._addDialogService.open(
      ArchiveTransferAddComponent,
      ADD_DIALOG_REF
    );
    addDialogRef.componentInstance!.addEvent
      .subscribe((archiveTransfer: ArchiveTransfer) => {
        this.archiveTransfers.push(archiveTransfer);
        this._archiveTransferService.addArchiveTransfer(archiveTransfer)
          .subscribe(newArchiveTransfer => {
              this._keepAddDialogUpdated(addDialogRef.componentInstance!, newArchiveTransfer.id);
            }
          );
      });
  }

  onHoverIn(archiveTransferOption: MatListOption): void {
    this.archiveTransferList.selectedOptions.select(archiveTransferOption);
  }

  onHoverOut(): void {
    this.archiveTransferList.deselectAll();
  }

  delete(archiveTransfer: ArchiveTransfer): void {
    const dialogRef = this._dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirmer la suppression',
        content: `Confirmez-vous la suppression du versement ${archiveTransfer.id} ?`
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.archiveTransfers = this.archiveTransfers.filter(at => at !== archiveTransfer);
        this._archiveTransferService.deleteArchiveTransfer(archiveTransfer).subscribe();
      }
    });
  }

  submit(archiveTransfer: ArchiveTransfer): void {
    const dialogRef = this._dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirmer la soumission',
        content: `Confirmez-vous la soumission du versement ${archiveTransfer.id} ?`
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // TODO
        this._archiveTransferService.updateArchiveTransfer(archiveTransfer).subscribe();
      }
    });
  }

  download(archiveTransfer: ArchiveTransfer): void {
    this._generateSip(archiveTransfer);
  }

  isLoading(archiveTransfer: ArchiveTransfer): boolean {
    return archiveTransfer.id === this.loadingArchiveTransferId;
  }

  getInProgressArchiveTransferCount(): number {
    return this.archiveTransfers?.filter(archiveTransfer => 'En cours' === archiveTransfer.status).length;
  }

  getPendingArchiveTransferCount(): number {
    return this.archiveTransfers?.filter(archiveTransfer => 'En attente de correction' === archiveTransfer.status).length;
  }

  getAllUnresolvedThreadCount(): number {
    return this.archiveTransfers?.filter((archiveTransfer: ArchiveTransfer) => archiveTransfer.archiveDataPackages.length > 0)
      .flatMap((archiveTransfer: ArchiveTransfer) => archiveTransfer.archiveDataPackages)
      .flatMap((archiveDataPackage: ArchiveDataPackage) => archiveDataPackage.archiveData)
      .flat()
      .filter((fileMetadata: FileMetadata) => this._hasUnresolvedThread(fileMetadata)).length;
  }

  hasUnresolvedThread(archiveTransfer: ArchiveTransfer): boolean {
    return archiveTransfer.archiveDataPackages
      .flatMap((archiveDataPackage: ArchiveDataPackage) => archiveDataPackage.archiveData)
      .flat()
      .some((fileMetadata: FileMetadata) => this._hasUnresolvedThread(fileMetadata));
  }

  getUnresolvedThreadCount(archiveTransfer: ArchiveTransfer): number {
    return archiveTransfer.archiveDataPackages
      .flatMap((archiveDataPackage: ArchiveDataPackage) => archiveDataPackage.archiveData)
      .flat()
      .filter((fileMetadata: FileMetadata) => this._hasUnresolvedThread(fileMetadata)).length;
  }

  private _getArchiveTransfers(): void {
    this._archiveTransferService.getArchiveTransfers()
      .subscribe(archiveTransfers => this.archiveTransfers = archiveTransfers.sort(this._sortByLastModificationDate));
  }

  private _hasUnresolvedThread(fileMetadata: FileMetadata): boolean {
    return !!fileMetadata.comments && fileMetadata.comments.status === 'unresolved';
  }

  private _generateSip(archiveTransfer: ArchiveTransfer): void {
    this.loadingArchiveTransferId = archiveTransfer.id || null;
    this._sipService.generateSip(archiveTransfer).subscribe((response: HttpResponse<Blob>) => {
      saveAs(response.body || '', `projet-de-versement-${archiveTransfer.id}_${this._getFilename(response)}`);
      this.loadingArchiveTransferId = 0;
    });
  }

  private _getFilename(response: HttpResponse<Blob>): any {
    return response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1];
  }

  private _keepAddDialogUpdated(addDialog: ArchiveTransferAddComponent, newArchiveTransferId: number): void {
    const intervalId = setInterval((_: any) => { // FIXME fake timer to simulate back end processing
      if (addDialog.progressValue >= 100) {
        addDialog.newArchiveTransferId = newArchiveTransferId;
        clearInterval(intervalId);
      } else {
        addDialog.progressValue++;
      }
    }, 10);
  }
}
