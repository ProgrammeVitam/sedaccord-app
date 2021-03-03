import {FlatTreeControl} from '@angular/cdk/tree';
import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {MatTreeFlatDataSource, MatTreeFlattener} from '@angular/material/tree';
import {Directory, FileNode} from '../dtos/file';
import {SelectionModel} from '@angular/cdk/collections';

interface FileFlatNode {
  expandable: boolean;
  name: string;
  level: number;
  isDirectory: boolean;
}

@Component({
  selector: 'app-file-tree',
  templateUrl: './file-tree.component.html',
  styleUrls: ['./file-tree.component.scss']
})
export class FileTreeComponent implements OnInit {
  @Input() fileTreeData!: FileNode[];
  @Output() selectFileEvent = new EventEmitter<FileNode>();

  treeControl = new FlatTreeControl<FileFlatNode>(
    node => node.level,
    node => node.expandable
  );

  private _transformer = (node: FileNode, level: number) => {
    const existingNode = this._nestedNodeMap.get(node);
    const directoryNode = node as Directory;
    const expandable = node.isDirectory ?
      this._hasChild(directoryNode)
      : false;
    const flatNode = existingNode ? existingNode : {
      expandable,
      name: node.name,
      level,
      isDirectory: node.isDirectory
    } as FileFlatNode;
    this._flatNodeMap.set(flatNode, node);
    this._nestedNodeMap.set(node, flatNode);
    return flatNode;
  }

  _treeFlattener = new MatTreeFlattener(
    this._transformer,
    node => node.level,
    node => node.expandable,
    node => node.isDirectory ? (node as Directory).children : null
  );

  dataSource = new MatTreeFlatDataSource(this.treeControl, this._treeFlattener);
  selection = new SelectionModel<FileFlatNode>(false);

  /** Map from flat node to nested node. This helps us finding the nested node to be modified */
  private _flatNodeMap = new Map<FileFlatNode, FileNode>();

  /** Map from nested node to flattened node. This helps us to keep the same object for selection */
  private _nestedNodeMap = new Map<FileNode, FileFlatNode>();
  ngOnInit(): void {
    this.dataSource.data = this.fileTreeData;
  }

  getLevel = (node: FileFlatNode) => node.level;

  hasChild = (_: number, node: FileFlatNode) => node.expandable;

  /** Select a file. Check all the parents to see if they changed */
  selectFile(node: FileFlatNode): void {
    if (node.isDirectory) {
      this.selection.select(node);
      this._checkAllParentsSelection(node);
      this.selectFileEvent.emit(this._flatNodeMap.get(node));
    }
  }

  /** Select the category so we can insert the new item. */
  addFile(): void {
    // TODO
  }

  isSelected(node: FileFlatNode): boolean {
    return this._descendantsOneOfSelected(node);
  }

  private _hasChild(directoryNode: Directory): boolean {
    return directoryNode.children !== undefined && directoryNode.children.length > 0;
  }

  /** Checks all the parents when a leaf node is selected/unselected */
  private _checkAllParentsSelection(node: FileFlatNode): void {
    let parent: FileFlatNode | null = this._getParentNode(node);
    while (parent) {
      this._checkRootNodeSelection(parent);
      parent = this._getParentNode(parent);
    }
  }

  /** Check root node checked state and change it accordingly */
  private _checkRootNodeSelection(node: FileFlatNode): void {
    const nodeSelected = this.selection.isSelected(node);
    const descendants = this.treeControl.getDescendants(node);
    const descAllSelected = descendants.length > 0 && descendants.every(child => {
      return this.selection.isSelected(child);
    });
    if (nodeSelected && !descAllSelected) {
      this.selection.deselect(node);
    } else if (!nodeSelected && descAllSelected) {
      this.selection.select(node);
    }
  }

  private _getParentNode(node: FileFlatNode): FileFlatNode | null {
    const currentLevel = this.getLevel(node);

    if (currentLevel < 1) {
      return null;
    }

    const startIndex = this.treeControl.dataNodes.indexOf(node) - 1;

    for (let i = startIndex; i >= 0; i--) {
      const currentNode = this.treeControl.dataNodes[i];

      if (this.getLevel(currentNode) < currentLevel) {
        return currentNode;
      }
    }
    return null;
  }

  /** Whether the node or one of its descendants is selected. */
  private _descendantsOneOfSelected(node: FileFlatNode): boolean {
    if (this.selection.isEmpty()) {
      return false;
    }
    if (this.selection.isSelected(node)) {
      return true;
    }
    const descendants = this.treeControl.getDescendants(node);
    return descendants.length > 0 && descendants.some(child => {
      return this.selection.isSelected(child);
    });
  }
}
