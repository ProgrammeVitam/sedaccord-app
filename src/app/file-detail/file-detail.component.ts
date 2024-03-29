import {Component, EventEmitter, Inject, Input, OnInit, Output} from '@angular/core';
import {FormArray, FormBuilder, FormGroup} from '@angular/forms';
import {DialogReference, FILE_DETAIL_SIDENAV_REF} from '../complex-dialog/complex-dialog.service';
import {animate, style, transition, trigger} from '@angular/animations';
import {FileMetadata, FileUtil} from '../dtos/file';
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
  @Output() updateEvent!: EventEmitter<any>;

  currentUser!: User;

  fileFormGroup!: FormGroup;
  commentFormGroup!: FormGroup;
  isOpen;

  constructor(
    @Inject(FILE_DETAIL_SIDENAV_REF) private _sidenavRef: DialogReference<FileDetailComponent>,
    private _formBuilder: FormBuilder,
    private _authService: AuthService,
    private _dialog: MatDialog
  ) {
    this.updateEvent = new EventEmitter<any>();
    this.isOpen = true;
  }

  get commentFormArray(): FormArray {
    return this.commentFormGroup.get('commentFormArray') as FormArray;
  }

  hasUnresolvedThread = () => FileUtil.hasUnresolvedThread(this.fileData);

  hasComment = () => FileUtil.getCommentCount(this.fileData) > 0;

  getCommentCount = () => FileUtil.getCommentCount(this.fileData);

  ngOnInit(): void {
    this._getCurrentUser();
    this.fileFormGroup = this._formBuilder.group({
      name: [this.fileData.newName || this.fileData.name],
      startDate: [this.fileData.startDate || this.fileData.creationDate],
      endDate: [this.fileData.endDate || this.fileData.lastModificationDate],
      description: [this.fileData.description]
    });
    this.commentFormGroup = this._formBuilder.group({
      commentFormArray: this._formBuilder.array([]),
      text: ['']
    });
    this.fileData.comments?.thread.forEach(comment => {
      this.commentFormArray.push(this._formBuilder.control(comment));
    });
  }

  closeThread(): void {
    this.fileData.comments!.status = 'RESOLVED';
    this.updateEvent.emit(this.fileData);
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
        this.commentFormArray.removeAt(index);
        this.fileData.comments!.thread = this.commentFormArray.value;
        this.updateEvent.emit(this.fileData);
      }
    });
  }

  cancelUpdate(): void {
    this._closeSidenav();
  }

  submitFile(): void {
    this.fileData.newName = this.fileFormGroup.value.name;
    this.fileData.startDate = this.fileFormGroup.value.startDate;
    this.fileData.endDate = this.fileFormGroup.value.endDate;
    this.fileData.description = this.fileFormGroup.value.description;
    this.updateEvent.emit(null);
    this._closeSidenav();
  }

  submitComment(): void {
    const comment = {
      date: new Date(),
      username: this.currentUser.name,
      text: this.commentFormGroup.value.text
    };
    this.commentFormArray.push(this._formBuilder.control(comment));
    if (this.fileData.comments) {
      this.fileData.comments.status = 'UNRESOLVED';
      this.fileData.comments.thread = this.commentFormArray.value;
    } else {
      this.fileData.comments = {
        status: 'UNRESOLVED',
        thread: this.commentFormArray.value
      };
    }
    this.updateEvent.emit(this.fileData);
    this.commentFormGroup.get('text')!.reset();
  }

  private _getCurrentUser(): void {
    this.currentUser = this._authService.getCurrentUserValue();
  }

  private _closeSidenav(): void {
    setTimeout((_: any) => this._sidenavRef.close(), TRANSITION_DURATION);
    this.isOpen = false;
  }
}
