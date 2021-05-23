import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {MatSort} from '@angular/material/sort';
import {MatTable, MatTableDataSource} from '@angular/material/table';
import {SelectionModel} from '@angular/cdk/collections';
import {FileMetadata} from '../dtos/file';

@Component({
  selector: 'app-file-table',
  templateUrl: './file-table.component.html',
  styleUrls: ['./file-table.component.scss']
})
export class FileTableComponent implements OnChanges, OnInit, AfterViewInit {
  @Input() fileTableData: FileMetadata[] = [];
  @Output() selectFileEvent = new EventEmitter<FileMetadata>();

  displayedColumns: string[] = ['name', 'startDate', 'endDate', 'size', 'format', 'description', 'edit', 'delete'];
  dataSource!: MatTableDataSource<FileMetadata>;
  selection!: SelectionModel<FileMetadata>;

  @ViewChild(MatTable, {static: true}) table!: MatTable<FileMetadata[]>;
  @ViewChild(MatSort) sort!: MatSort;

  constructor() {
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Listen to when data from parent is available
    if (this.dataSource) { // ngOnChanges called before ngOnInit
      this.dataSource.data = this.fileTableData;
    }
  }

  ngOnInit(): void {
    this.fileTableData = this.fileTableData || [];
    this.dataSource = new MatTableDataSource<FileMetadata>(this.fileTableData);
    this.selection = new SelectionModel<FileMetadata>(false);
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  onHoverIn(row: FileMetadata): void {
    this.selection.select(row);
  }

  onHoverOut(): void {
    this.selection.clear();
  }

  hasUnresolvedThread(element: FileMetadata): boolean {
    return this._hasUnresolvedThread(element);
  }

  hasComment(element: FileMetadata): boolean {
    return this._getCommentCount(element) > 0;
  }

  getCommentCount(element: FileMetadata): number {
    return this._getCommentCount(element);
  }

  edit(element: FileMetadata): void {
    this.selectFileEvent.emit(element);
  }

  private _hasUnresolvedThread(fileMetadata: FileMetadata): boolean {
    return !!fileMetadata.comments && fileMetadata.comments.status === 'unresolved';
  }

  private _getCommentCount(fileMetadata: FileMetadata): number {
    return (fileMetadata.comments?.thread || []).length;
  }
}
