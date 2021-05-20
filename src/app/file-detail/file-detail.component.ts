import {Component, EventEmitter, Inject, Input, OnInit, Output} from '@angular/core';
import {FormArray, FormBuilder, FormGroup} from '@angular/forms';
import {DialogReference, FILE_DETAIL_SIDENAV_REF} from '../complex-dialog/complex-dialog.service';
import {animate, style, transition, trigger} from '@angular/animations';
import {ArchiveTransferService} from '../services/archive-transfer.service';
import {FileMetadata} from '../dtos/file';
import {ConfirmDialogComponent} from '../confirm-dialog/confirm-dialog.component';
import {MatDialog} from '@angular/material/dialog';
import {AuthService} from '../services/auth.service';
import {User} from '../dtos/user';

const TRANSITION_DURATION = 300;

@Component({
  selector: 'app-file-detail',
  templateUrl: './file-detail.component.html',
  styleUrls: ['./file-detail.component.scss'],
  animations: [
    trigger('openClose', [
      transition(':enter', [
        style({transform: 'translateX(100%)'}),
        animate(TRANSITION_DURATION)
      ]),
      transition(':leave', [
        animate(TRANSITION_DURATION, style({transform: 'translateX(100%)'}))
      ])
    ])
  ]
})
export class FileDetailComponent implements OnInit {
  @Input() fileData!: FileMetadata;
  @Output() updateEvent!: EventEmitter<FileMetadata>;

  currentUser!: User;

  fileForm!: FormGroup;
  commentForm!: FormGroup;
  isOpen = true;

  constructor(
    @Inject(FILE_DETAIL_SIDENAV_REF) private _sidenavRef: DialogReference<FileDetailComponent>,
    private _formBuilder: FormBuilder,
    private _authService: AuthService,
    private _archiveTransferService: ArchiveTransferService,
    private _dialog: MatDialog
  ) {
    this.updateEvent = new EventEmitter<FileMetadata>();
    this._getCurrentUser();
  }

  get comments(): FormArray {
    return this.commentForm.get('comments') as FormArray;
  }

  ngOnInit(): void {
    this.fileForm = this._formBuilder.group({
      name: [this.fileData.newName || this.fileData.name],
      startDate: [this.fileData.creationDate || this.fileData.startDate],
      endDate: [this.fileData.lastModificationDate || this.fileData.endDate],
      description: [this.fileData.description]
    });
    this.commentForm = this._formBuilder.group({
      comments: this._formBuilder.array([]),
      text: ['']
    });
    this.fileData.comments?.thread.forEach(comment => {
      this.comments.push(this._formBuilder.control(comment));
    });
  }

  hasUnresolvedThread(): boolean {
    return this._hasUnresolvedThread(this.fileData);
  }

  hasComment(): boolean {
    return this._getCommentCount(this.fileData) > 0;
  }

  getCommentCount(): number {
    return this._getCommentCount(this.fileData);
  }

  onCancel(): void {
    this._closeSidenav();
  }

  onSubmitFile(): void {
    this.fileData.newName = this.fileForm.value.name;
    this.fileData.startDate = this.fileForm.value.startDate;
    this.fileData.endDate = this.fileForm.value.endDate;
    this.fileData.description = this.fileForm.value.description;
    this.updateEvent.emit(this.fileData);
    this._closeSidenav();
  }

  deleteComment(index: number): void {
    const dialogRef = this._dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirmer la suppression',
        content: `Confirmez-vous la suppression du commentaire ?`
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.comments.removeAt(index);
        this.fileData.comments!.thread = this.comments.value;
        this.updateEvent.emit(this.fileData);
      }
    });
  }

  closeThread(): void {
    this.fileData.comments!.status = 'resolved';
    this.updateEvent.emit(this.fileData);
  }

  onSubmitComment(): void {
    const comment = {
      date: new Date(),
      username: this.currentUser.name,
      text: this.commentForm.value.text
    };
    this.comments.push(this._formBuilder.control(comment));
    if (this.fileData.comments) {
      this.fileData.comments.status = 'unresolved';
      this.fileData.comments.thread = this.comments.value;
    } else {
      this.fileData.comments = {
        status: 'unresolved',
        thread: this.comments.value
      };
    }
    this.updateEvent.emit(this.fileData);
    this.commentForm.get('text')!.reset();
  }

  private _getCurrentUser(): void {
    this._authService.getCurrentUser().subscribe(currentUser => this.currentUser = currentUser);
  }

  private _closeSidenav(): void {
    setTimeout((_: any) => this._sidenavRef.close(), TRANSITION_DURATION);
    this.isOpen = false;
  }

  private _hasUnresolvedThread(fileMetadata: FileMetadata): boolean {
    return !!fileMetadata.comments && fileMetadata.comments.status === 'unresolved';
  }

  private _getCommentCount(fileMetadata: FileMetadata): number {
    return (fileMetadata.comments?.thread || []).length;
  }
}
