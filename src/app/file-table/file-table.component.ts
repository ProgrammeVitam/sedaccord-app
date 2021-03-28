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
import {FileNode} from '../dtos/file';

@Component({
  selector: 'app-file-table',
  templateUrl: './file-table.component.html',
  styleUrls: ['./file-table.component.scss']
})
export class FileTableComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() elementData!: FileNode[];
  @Output() selectFileEvent = new EventEmitter<FileNode>();

  displayedColumns: string[] = ['name', 'creationDate', 'lastModificationDate', 'size', 'format', 'description', 'edit', 'delete'];
  dataSource!: MatTableDataSource<FileNode>;
  selection!: SelectionModel<FileNode>;

  @ViewChild(MatTable, {static: true}) table!: MatTable<FileNode[]>;
  @ViewChild(MatSort) sort!: MatSort;

  constructor() {
  }

  ngOnInit(): void {
    this.dataSource = new MatTableDataSource<FileNode>(this.elementData);
    this.selection = new SelectionModel<FileNode>(false);
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.dataSource) {
      this.dataSource.data = this.elementData;
    }
  }

  onHoverIn(row: FileNode): void {
    this.selection.select(row);
  }

  onHoverOut(): void {
    this.selection.clear();
  }

  edit(row: FileNode): void {
    this.selectFileEvent.emit(row);
  }
}
