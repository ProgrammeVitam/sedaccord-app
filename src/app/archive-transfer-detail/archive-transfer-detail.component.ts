import {Component, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {ArchiveTransfer} from '../dtos/archive-transfer';
import {ArchiveTransferService} from '../services/archive-transfer.service';
import {ConfirmDialogComponent} from '../confirm-dialog/confirm-dialog.component';
import {MatDialog} from '@angular/material/dialog';
import {AuthService} from '../services/auth.service';
import {User} from '../dtos/user';
import {ArchiveTransferContextComponent} from '../archive-transfer-context/archive-transfer-context.component';
import {ArchiveTransferFilesComponent} from '../archive-transfer-files/archive-transfer-files.component';

@Component({
  selector: 'app-archive-transfer-detail',
  templateUrl: './archive-transfer-detail.component.html',
  styleUrls: ['./archive-transfer-detail.component.scss']
})
export class ArchiveTransferDetailComponent implements OnInit {
  currentUser!: User;
  archiveTransfer!: ArchiveTransfer;

  saveButtonDisabled: boolean;

  @ViewChild(ArchiveTransferContextComponent) contextForm!: ArchiveTransferContextComponent;
  @ViewChild(ArchiveTransferFilesComponent) filesForm!: ArchiveTransferFilesComponent;

  constructor(
    private _route: ActivatedRoute,
    private _archiveTransferService: ArchiveTransferService,
    private _authService: AuthService,
    private _dialog: MatDialog,
    private _router: Router
  ) {
    this.saveButtonDisabled = true;
  }

  ngOnInit(): void {
    this._getCurrentUser();
    const id = this._route.snapshot.paramMap.get('id');
    if (id) {
      this._getArchiveTransfer(+id);
    }
  }

  updateSaveButtonDisabledState(state: boolean): void {
    this.saveButtonDisabled = state;
  }

  submit(): void {
    this.contextForm.updateArchiveTransfer();
    this.filesForm.updateArchiveTransfer();
    this._archiveTransferService.updateArchiveTransfer(this.archiveTransfer)
      .subscribe();
    this.updateSaveButtonDisabledState(true);
  }

  updateArchiveTransfer(): void {
    this._archiveTransferService.updateArchiveTransfer(this.archiveTransfer)
      .subscribe();
  }

  shareArchiveTransfer(): void {
    const dialogRef = this._dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirmer la soumission',
        content: `Confirmez-vous la soumission du versement ${this.archiveTransfer.id} ?`
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.archiveTransfer.share();
        this._archiveTransferService.updateArchiveTransfer(this.archiveTransfer, 'SUBMITTED_ARCHIVE_TRANSFER')
          .subscribe(_ => this._router.navigate(['']));
      }
    });
  }

  private _getCurrentUser(): void {
    this.currentUser = this._authService.getCurrentUserValue();
  }

  private _getArchiveTransfer(id: number): void {
    this._archiveTransferService.getArchiveTransfer(id)
      .subscribe(archiveTransfer => this.archiveTransfer = archiveTransfer);
  }
}
