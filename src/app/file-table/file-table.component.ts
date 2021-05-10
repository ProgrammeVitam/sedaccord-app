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
export class FileTableComponent implements OnChanges, OnInit, AfterViewInit {
  @Input() elementData!: FileNode[];
  @Output() selectFileEvent = new EventEmitter<FileNode>();

  displayedColumns: string[] = ['name', 'creationDate', 'lastModificationDate', 'size', 'format', 'description', 'edit', 'delete'];
  dataSource!: MatTableDataSource<FileNode>;
  selection!: SelectionModel<FileNode>;

  @ViewChild(MatTable, {static: true}) table!: MatTable<FileNode[]>;
  @ViewChild(MatSort) sort!: MatSort;

  constructor() {
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Listen to when data from parent is available
    if (this.dataSource) { // ngOnChanges called before ngOnInit
      this.dataSource.data = this.elementData;
    }
  }

  ngOnInit(): void {
    this.dataSource = new MatTableDataSource<FileNode>(this.elementData);
    this.selection = new SelectionModel<FileNode>(false);
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
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
