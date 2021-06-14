import {Component, OnInit, ViewChild} from '@angular/core';
import {ArchiveTransferAddComponent} from '../archive-transfer-add/archive-transfer-add.component';
import {ADD_DIALOG_REF, ComplexDialogService} from '../complex-dialog/complex-dialog.service';
import {ArchiveDataPackage, ArchiveTransfer} from '../dtos/archive-transfer';
import {ArchiveTransferService} from '../services/archive-transfer.service';
import {MatDialog} from '@angular/material/dialog';
import {ConfirmDialogComponent} from '../confirm-dialog/confirm-dialog.component';
import {MatListOption, MatSelectionList} from '@angular/material/list';
import {SipService} from '../services/sip.service';
import {saveAs} from 'file-saver';
import {HttpResponse} from '@angular/common/http';
import {AuthService} from '../services/auth.service';
import {User} from '../dtos/user';
import {FileMetadata, FileUtil} from '../dtos/file';
import {FakeLoginDialogComponent} from '../fake-login-dialog/fake-login-dialog.component';
import {switchMap} from 'rxjs/operators';
import {forkJoin} from 'rxjs';
import {MessageService} from '../services/message.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Message, MessageUtil} from '../dtos/message';

const DEFAULT_USER = 'Patrick Dupont';

type SortValue = 'creationDate' | 'lastModificationDate';

@Component({
  selector: 'app-archive-transfers',
  templateUrl: './archive-transfers.component.html',
  styleUrls: ['./archive-transfers.component.scss']
})
export class ArchiveTransfersComponent implements OnInit {
  currentUser!: User;
  archiveTransfers!: ArchiveTransfer[];

  userIsLogged: boolean;
  downloadButtonDisabled: boolean;
  loadingArchiveTransferId: number | null;

  @ViewChild('archiveTransferList') archiveTransferList!: MatSelectionList;

  constructor(
    private _addDialogService: ComplexDialogService<ArchiveTransferAddComponent>,
    private _authService: AuthService,
    private _archiveTransferService: ArchiveTransferService,
    private _messageService: MessageService,
    private _sipService: SipService,
    private _dialog: MatDialog,
    private _snackBar: MatSnackBar
  ) {
    this.userIsLogged = false;
    this.downloadButtonDisabled = true;
    this.loadingArchiveTransferId = null;
  }

  _sortByLastModificationDate = (archiveTransfer1: ArchiveTransfer, archiveTransfer2: ArchiveTransfer) =>
    archiveTransfer2.lastModificationDate.getTime() - archiveTransfer1.lastModificationDate.getTime()

  _sortByCreationDate = (archiveTransfer1: ArchiveTransfer, archiveTransfer2: ArchiveTransfer) =>
    archiveTransfer2.creationDate.getTime() - archiveTransfer1.creationDate.getTime()

  ngOnInit(): void {
    this._getCurrentUserAndHisArchiveTransfers(this._authService.getCurrentUserValue()?.name || DEFAULT_USER);
    this._sipService.isAvailable()
      .subscribe(response => this.downloadButtonDisabled = response.status !== 'UP');
  }

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

  getInProgressArchiveTransferCount(): number {
    return this.archiveTransfers?.filter(archiveTransfer => archiveTransfer.status === 'En cours').length;
  }

  getPendingArchiveTransferCount(): number {
    return this.archiveTransfers?.filter(archiveTransfer => archiveTransfer.status === 'En attente de correction').length;
  }

  getAllUnresolvedThreadCount(): number {
    return this.archiveTransfers?.filter((archiveTransfer: ArchiveTransfer) => archiveTransfer.archiveDataPackages.length)
      .flatMap((archiveTransfer: ArchiveTransfer) => archiveTransfer.archiveDataPackages)
      .flatMap((archiveDataPackage: ArchiveDataPackage) => archiveDataPackage.archiveData)
      .flat()
      .filter((fileMetadata: FileMetadata) => FileUtil.hasUnresolvedThread(fileMetadata)).length;
  }

  hasUnresolvedThread(archiveTransfer: ArchiveTransfer): boolean {
    return archiveTransfer.archiveDataPackages
      .flatMap((archiveDataPackage: ArchiveDataPackage) => archiveDataPackage.archiveData)
      .flat()
      .some((fileMetadata: FileMetadata) => FileUtil.hasUnresolvedThread(fileMetadata));
  }

  getUnresolvedThreadCount(archiveTransfer: ArchiveTransfer): number {
    return archiveTransfer.archiveDataPackages
      .flatMap((archiveDataPackage: ArchiveDataPackage) => archiveDataPackage.archiveData)
      .flat()
      .filter((fileMetadata: FileMetadata) => FileUtil.hasUnresolvedThread(fileMetadata)).length;
  }

  downloadIsInProgress(archiveTransfer: ArchiveTransfer): boolean {
    return archiveTransfer.id === this.loadingArchiveTransferId;
  }

  openFakeLoginDialog(currentUserName: string): void {
    const dialogRef = this._dialog.open(FakeLoginDialogComponent, {
      data: {currentUserName}
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
        this._archiveTransferService.addArchiveTransfer(archiveTransfer)
          .subscribe(newArchiveTransfer => this._keepAddDialogUpdated(addDialogRef.componentInstance!, newArchiveTransfer.id));
        this.archiveTransfers.push(archiveTransfer);
      });
  }

  selectArchiveTransfer(archiveTransferOption: MatListOption): void {
    this.archiveTransferList.selectedOptions.select(archiveTransferOption);
  }

  deselectAll(): void {
    this.archiveTransferList.deselectAll();
  }

  deleteArchiveTransfer(archiveTransferToDelete: ArchiveTransfer): void {
    const dialogRef = this._dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirmer la suppression',
        content: `Confirmez-vous la suppression du versement ${archiveTransferToDelete.id} ?`
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this._archiveTransferService.deleteArchiveTransfer(archiveTransferToDelete)
          .subscribe();
        this.archiveTransfers = this.archiveTransfers.filter(archiveTransfer => archiveTransfer !== archiveTransferToDelete);
      }
    });
  }

  shareArchiveTransfer(archiveTransfer: ArchiveTransfer): void {
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

  downloadArchiveTransfer(archiveTransfer: ArchiveTransfer): void {
    this._generateSip(archiveTransfer);
  }

  private _switchUser(name: string): void {
    this._getCurrentUserAndHisArchiveTransfers(name);
  }

  private _getCurrentUserAndHisArchiveTransfers(name: string): void {
    this.userIsLogged = false;
    const user$ = this._authService.login(name);
    const archiveTransfers$ = user$.pipe(
      switchMap(user => this._archiveTransferService.findArchiveTransfersForUser(user.id, user.role))
    );
    const messages$ = forkJoin([user$, archiveTransfers$]).pipe(
      switchMap(([user, archiveTransfers]) =>
        this._messageService.getLatestMessagesForUser(archiveTransfers.map(archiveTransfer => archiveTransfer.id), user.id))
    );
    forkJoin([user$, archiveTransfers$, messages$]).subscribe(
      ([user, archiveTransfers, messages]) => {
        this.currentUser = user;
        this.archiveTransfers = archiveTransfers.sort(this._sortByLastModificationDate);
        this._notifyUser(messages);
        this.userIsLogged = true;
      });
  }

  private _notifyUser(messages: Message[]): void {
    const displayMessages = MessageUtil.getDisplayMessages(messages);
    if (displayMessages.length) {
      this._snackBar.open(displayMessages.join('\n'), 'Vu');
    }
  }

  private _generateSip(archiveTransfer: ArchiveTransfer): void {
    this.loadingArchiveTransferId = archiveTransfer.id || null;
    this._sipService.generateSip(archiveTransfer)
      .subscribe((response: HttpResponse<Blob>) => {
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
