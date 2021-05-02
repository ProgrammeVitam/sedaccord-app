import {Component, Inject, Input, OnInit} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import {DialogReference, FILE_DETAIL_SIDENAV_REF} from '../complex-dialog/complex-dialog.service';
import {animate, style, transition, trigger} from '@angular/animations';
import {ArchiveTransferService} from '../services/archive-transfer.service';
import {FileComment} from '../dtos/archive-transfer';
import {FileNode} from '../dtos/file';

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
  @Input() file!: FileNode;

  fileForm!: FormGroup;
  commentForm!: FormGroup;
  isOpen = true;

  comments: FileComment[];

  constructor(
    @Inject(FILE_DETAIL_SIDENAV_REF) private _sidenavRef: DialogReference<FileDetailComponent>,
    private _formBuilder: FormBuilder,
    private _archiveTransferService: ArchiveTransferService
  ) {
    this.comments = [];
  }

  ngOnInit(): void {
    this._getComments();
    this.fileForm = this._formBuilder.group({
      name: [this.file.name],
      creationDate: [this.file.creationDate],
      lastModificationDate: [this.file.lastModificationDate],
      description: [''],
      rule: ['']
    });
    this.commentForm = this._formBuilder.group({
      text: ['']
    });
  }

  onCancel(): void {
    this._closeSidenav();
  }

  onSubmitFile(): void {
    this._closeSidenav();
    // TODO
  }

  onSubmitComment(): void {
    const comment = {
      date: new Date(),
      user: 'Patrick',
      text: this.commentForm.value.text,
      file: this.file.name
    };
    this.comments.push(comment);
    this._archiveTransferService.addComment(comment).subscribe();
    this.commentForm.reset();
  }

  private _closeSidenav(): void {
    setTimeout((_: any) => this._sidenavRef.close(), TRANSITION_DURATION);
    this.isOpen = false;
  }

  private _getComments(): void {
    this._archiveTransferService.getComments(this.file.name)
      .subscribe(comments => this.comments = comments);
  }
}
