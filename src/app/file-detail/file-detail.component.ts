import {Component, EventEmitter, Inject, Input, OnInit, Output} from '@angular/core';
import {FormArray, FormBuilder, FormGroup} from '@angular/forms';
import {DialogReference, FILE_DETAIL_SIDENAV_REF} from '../complex-dialog/complex-dialog.service';
import {animate, style, transition, trigger} from '@angular/animations';
import {ArchiveTransferService} from '../services/archive-transfer.service';
import {FileMetadata} from '../dtos/file';

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

  fileForm!: FormGroup;
  commentForm!: FormGroup;
  isOpen = true;

  constructor(
    @Inject(FILE_DETAIL_SIDENAV_REF) private _sidenavRef: DialogReference<FileDetailComponent>,
    private _formBuilder: FormBuilder,
    private _archiveTransferService: ArchiveTransferService
  ) {
    this.updateEvent = new EventEmitter<FileMetadata>();
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
    this.fileData.comments?.forEach(comment => {
      this.comments.push(this._formBuilder.control(comment));
    });
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
    this.comments.removeAt(index);
    this.fileData.comments = this.comments.value;
    this.updateEvent.emit(this.fileData);
  }

  onSubmitComment(): void {
    const comment = {
      date: new Date(),
      username: 'Patrick', // TODO
      text: this.commentForm.value.text,
      file: this.fileData.name
    };
    this.comments.push(this._formBuilder.control(comment));
    this.fileData.comments = this.comments.value;
    this.updateEvent.emit(this.fileData);
    this.commentForm.get('text')!.reset();
  }

  private _closeSidenav(): void {
    setTimeout((_: any) => this._sidenavRef.close(), TRANSITION_DURATION);
    this.isOpen = false;
  }
}
