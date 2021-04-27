import {Component, ViewChild} from '@angular/core';
import {ArchiveTransferAddComponent} from '../archive-transfer-add/archive-transfer-add.component';
import {ADD_DIALOG_REF, ComplexDialogService} from '../complex-dialog/complex-dialog.service';
import {ArchiveTransfer} from '../dtos/archive-transfer';
import {ArchiveTransferService} from '../services/archive-transfer.service';
import {MatDialog} from '@angular/material/dialog';
import {ConfirmDialogComponent} from '../confirm-dialog/confirm-dialog.component';
import {MatListOption, MatSelectionList} from '@angular/material/list';
import {Router} from '@angular/router';
import {SipService} from '../services/sip.service';
import { saveAs } from 'file-saver';
import {HttpResponse} from '@angular/common/http';

@Component({
  selector: 'app-archive-transfers',
  templateUrl: './archive-transfers.component.html',
  styleUrls: ['./archive-transfers.component.scss']
})
export class ArchiveTransfersComponent {
  name = 'Caroline';

  loadingArchiveTransferId = 0;

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
          .subscribe(newArchiveTransfer => this._router.navigate([`/detail/${newArchiveTransfer.id}`]));
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
        archiveTransfer.submit();
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

  private _getArchiveTransfers(): void {
    this._archiveTransferService.getArchiveTransfers()
      .subscribe(archiveTransfers => this.archiveTransfers = archiveTransfers);
  }

  private _generateSip(archiveTransfer: ArchiveTransfer): void {
    this.loadingArchiveTransferId = archiveTransfer.id;
    this._sipService.generateSip(archiveTransfer).subscribe((response: HttpResponse<Blob>) => {
      saveAs(response.body || '', `projet-de-versement-${archiveTransfer.id}_${this._getFilename(response)}`);
      this.loadingArchiveTransferId = 0;
    });
  }

  private _getFilename(response: HttpResponse<Blob>): any {
    return response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1];
  }
}
