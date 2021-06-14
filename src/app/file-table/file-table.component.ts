import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {MatSort} from '@angular/material/sort';
import {MatTable, MatTableDataSource} from '@angular/material/table';
import {SelectionModel} from '@angular/cdk/collections';
import {FileMetadata, FileUtil} from '../dtos/file';

@Component({
  selector: 'app-file-table',
  templateUrl: './file-table.component.html',
  styleUrls: ['./file-table.component.scss']
})
export class FileTableComponent implements OnChanges, AfterViewInit {
  @Input() fileTableData: FileMetadata[];
  @Output() selectFileEvent;

  displayedColumns: string[];
  dataSource: MatTableDataSource<FileMetadata>;
  selection!: SelectionModel<FileMetadata>;

  @ViewChild(MatTable, {static: true}) table!: MatTable<FileMetadata[]>;
  @ViewChild(MatSort) sort!: MatSort;

  constructor() {
    this.fileTableData = [];
    this.selectFileEvent = new EventEmitter<FileMetadata>();
    this.displayedColumns = ['name', 'startDate', 'endDate', 'size', 'format', 'description', 'edit', 'delete'];
    this.dataSource = new MatTableDataSource<FileMetadata>(this.fileTableData);
    this.selection = new SelectionModel<FileMetadata>(false);
  }

  hasUnresolvedThread = (element: FileMetadata) => FileUtil.hasUnresolvedThread(element);

  hasComment = (element: FileMetadata) => FileUtil.getCommentCount(element) > 0;

  getCommentCount = (element: FileMetadata) => FileUtil.getCommentCount(element);

  ngOnChanges(changes: SimpleChanges): void {
    // Listen to when data from parent is available
    this.dataSource.data = this.fileTableData;
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  selectFile(row: FileMetadata): void {
    this.selection.select(row);
  }

  deselectAll(): void {
    this.selection.clear();
  }

  editFile(element: FileMetadata): void {
    this.selectFileEvent.emit(element);
  }
}
