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
import {saveAs} from 'file-saver';
import {HttpResponse} from '@angular/common/http';
import {AuthService} from '../services/auth.service';
import {User} from '../dtos/user';
import {FileMetadata} from '../dtos/file';
import {FakeLoginDialogComponent} from '../fake-login-dialog/fake-login-dialog.component';
import {switchMap} from 'rxjs/operators';
import {forkJoin} from 'rxjs';
import {Message, MessageService} from '../services/message.service';
import {MatSnackBar} from '@angular/material/snack-bar';

type SortValue = 'creationDate' | 'lastModificationDate';

@Component({
  selector: 'app-archive-transfers',
  templateUrl: './archive-transfers.component.html',
  styleUrls: ['./archive-transfers.component.scss']
})
export class ArchiveTransfersComponent {
  disabledDownload: boolean;
  loading!: boolean;
  loadingArchiveTransferId: number | null;

  currentUser!: User;
  archiveTransfers!: ArchiveTransfer[];

  @ViewChild('archiveTransferList') archiveTransferList!: MatSelectionList;

  constructor(
    private _router: Router,
    private _addDialogService: ComplexDialogService<ArchiveTransferAddComponent>,
    private _authService: AuthService,
    private _archiveTransferService: ArchiveTransferService,
    private _messageService: MessageService,
    private _sipService: SipService,
    private _dialog: MatDialog,
    private _snackBar: MatSnackBar
  ) {
    this._getCurrentUserAndHisArchiveTransfers(this._authService.getCurrentUserValue()?.name || 'Patrick Dupont');
    this.disabledDownload = true;
    this.loadingArchiveTransferId = null;
    this._sipService.isAvailable()
      .subscribe(response => this.disabledDownload = response.status !== 'UP');
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

  openFakeLoginDialog(currentUserName: string): void {
    const dialogRef = this._dialog.open(FakeLoginDialogComponent, {
      data: { currentUserName }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this._switchUser(result);
      }
    });
  }

  openAddDialog(): void {
    const addDialogRef = this._addDialogService.open(
      ArchiveTransferAddComponent,
      ADD_DIALOG_REF
    );
    addDialogRef.componentInstance!.addEvent
      .subscribe((archiveTransfer: ArchiveTransfer) => {
        archiveTransfer.submissionUserId = this.currentUser.id;
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
        archiveTransfer.share();
        this._archiveTransferService.updateArchiveTransfer(archiveTransfer, 'SUBMITTED_ARCHIVE_TRANSFER')
          .subscribe();
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
    return this.archiveTransfers?.filter((archiveTransfer: ArchiveTransfer) => archiveTransfer.archiveDataPackages.length)
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

  private _getCurrentUserAndHisArchiveTransfers(name: string): void {
    this.loading = true;
    const user$ = this._authService.login(name);
    const archiveTransfers$ = user$.pipe(switchMap(user => this._archiveTransferService.findArchiveTransfersForUser(user.id, user.role)));
    const messages$ = forkJoin([user$, archiveTransfers$]).pipe(switchMap(([user, archiveTransfers]) => this._messageService
      .getLatestMessagesForUser(archiveTransfers.map(archiveTransfer => archiveTransfer.id), user.id)));
    forkJoin([user$, archiveTransfers$, messages$]).subscribe(
      ([user, archiveTransfers, messages]) => {
        this.currentUser = user;
        this.archiveTransfers = archiveTransfers.sort(this._sortByLastModificationDate);
        const displayMessages = this._getDisplayMessages(messages);
        if (displayMessages.length) {
          this._snackBar.open(displayMessages.join('\n'), 'Vu');
        }
        this.loading = false;
      });
  }

  private _hasUnresolvedThread(fileMetadata: FileMetadata): boolean {
    return !!fileMetadata.comments && fileMetadata.comments.status === 'UNRESOLVED';
  }

  private _switchUser(name: string): void {
    this._getCurrentUserAndHisArchiveTransfers(name);
  }

  private _getDisplayMessages(messages: Message[]): string[] {
    return messages.map(message => message.type)
      .filter((type, i, arr) => arr.indexOf(type) === i) // Filter unique values
      .reduce((acc: string[], currentValue) => {
      switch (currentValue) {
        case 'SUBMITTED_ARCHIVE_TRANSFER':
          acc.push('Une nouvelle demande de versement est arrivée.');
          break;
        case 'UPDATED_ARCHIVE_TRANSFER':
          acc.push('Un versement a été mis à jour.');
          break;
      }
      return acc;
    }, []);
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
