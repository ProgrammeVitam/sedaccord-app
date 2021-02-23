import {Component} from '@angular/core';
import {ArchiveTransferAddComponent} from '../archive-transfer-add/archive-transfer-add.component';
import {ADD_DIALOG_REF, ComplexDialogService} from '../complex-dialog/complex-dialog.service';
import {ArchiveTransfer} from '../dtos/archive-transfer';
import {ArchiveTransferService} from '../services/archive-transfer.service';

@Component({
  selector: 'app-archive-transfers',
  templateUrl: './archive-transfers.component.html',
  styleUrls: ['./archive-transfers.component.scss']
})
export class ArchiveTransfersComponent {
  archiveTransfers: ArchiveTransfer[];

  constructor(
    private _addDialogService: ComplexDialogService<ArchiveTransferAddComponent>,
    private _archiveTransferService: ArchiveTransferService
  ) {
    this._getArchiveTransfers();
  }

  openAddDialog(): void {
    const addDialogRef = this._addDialogService.open(
      ArchiveTransferAddComponent,
      ADD_DIALOG_REF
    );
    addDialogRef.componentInstance.addEvent
      .subscribe(archiveTransfer => {
        this.archiveTransfers.push(archiveTransfer);
        this._archiveTransferService.addArchiveTransfer(archiveTransfer).subscribe();
      });
  }

  delete(archiveTransfer: ArchiveTransfer): void {
    this.archiveTransfers = this.archiveTransfers.filter(at => at !== archiveTransfer);
    this._archiveTransferService.deleteArchiveTransfer(archiveTransfer).subscribe();
  }

  submit(archiveTransfer: ArchiveTransfer): void {
    archiveTransfer.submit();
    this._archiveTransferService.updateArchiveTransfer(archiveTransfer).subscribe();
  }

  private _getArchiveTransfers(): void {
    this._archiveTransferService.getArchiveTransfers()
      .subscribe(archiveTransfers => this.archiveTransfers = archiveTransfers);
  }
}
