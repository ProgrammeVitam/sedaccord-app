import {FlatTreeControl} from '@angular/cdk/tree';
import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {MatTreeFlatDataSource, MatTreeFlattener} from '@angular/material/tree';
import {SelectionModel} from '@angular/cdk/collections';
import {FileInterface, FileMetadata} from '../dtos/file';

export type FileTreeSelectionModel = { parents: FileMetadata[], children: FileMetadata[] };

interface SimpleFile extends FileInterface {
  format: string;
}

interface Directory extends FileInterface {
  children?: FileNode[];
}

type FileNode = Directory | SimpleFile;

interface FileFlatNode {
  expandable: boolean;
  name: string;
  level: number;
}

@Component({
  selector: 'app-file-tree',
  templateUrl: './file-tree.component.html',
  styleUrls: ['./file-tree.component.scss']
})
export class FileTreeComponent implements OnInit, OnChanges {
  @Input() fileTreeData!: FileMetadata[];
  @Input() focused!: boolean;
  @Output() selectDirectoryEvent = new EventEmitter<FileTreeSelectionModel>();

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

  /** Map from nested node to file metadata. */
  private _nodeMap = new Map<FileNode, FileMetadata>();

  ngOnInit(): void {
    this.dataSource.data = this._buildTreeFromMaterialized(this.fileTreeData);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.focused && !this.focused) {
      this.selection.clear();
    }
  }

  getLevel = (node: FileFlatNode) => node.level;

  hasChild = (_: number, node: FileFlatNode) => node.expandable;

  /** Select a file. Check all the parents to see if they changed */
  selectDirectory(node: FileFlatNode): void {
    this.selection.select(node);
    const parents = this._checkAllParentsSelection(node)
      .map(parent => this._nodeMap.get(this._flatNodeMap.get(parent)!)!)
      .concat([this._nodeMap.get(this._flatNodeMap.get(node)!)!]);
    const directory = this._flatNodeMap.get(node) as Directory;
    const children = (directory.children || [])
      .map(fileNode => this._nodeMap.get(fileNode)!);
    this.selectDirectoryEvent.emit({parents, children});
  }

  /** Select the category so we can insert the new item. */
  addFile(): void {
    // TODO
  }

  isDirectory(node: FileFlatNode): boolean {
    return this._flatNodeMap.get(node)!.isDirectory;
  }

  isSelected(node: FileFlatNode): boolean {
    return this._descendantsOneOfSelected(node);
  }

  hasUnresolvedThread(node: FileFlatNode): boolean {
    return this._hasUnresolvedThread(node);
  }

  descendantsHaveUnresolvedThread(node: FileFlatNode): boolean {
    return this._descendantsOnlyOneOfHasUnresolvedThread(node);
  }

  hasComment(node: FileFlatNode): boolean {
    return this._getCommentCount(node) > 0;
  }

  descendantsHaveComment(node: FileFlatNode): boolean {
    return this._getDescendantsOnlyCommentCount(node) > 0;
  }

  getCommentCount(node: FileFlatNode): number {
    return this._getCommentCount(node);
  }

  getDescendantCommentCount(node: FileFlatNode): number {
    return this._getDescendantsOnlyCommentCount(node);
  }

  private _buildTreeFromMaterialized(data: FileMetadata[]): FileNode[] {
    if (data.length > 0) {
      const groupByDepth = this._groupByDepth(data);
      const groupByDepthAndNode = this._groupByDepthAndNode(groupByDepth);

      const keys = Array.from(groupByDepthAndNode.keys());
      const minLevel = Math.min(...keys);
      const maxLevel = Math.max(...keys);
      if (keys.length > maxLevel - minLevel + 1) {
        throw new Error('Invalid tree data: missing value in level range.');
      }

      // Build tree one level at a time from bottom to top
      const treeBottomLayer = groupByDepthAndNode.get(maxLevel) as Map<string, FileMetadata[]>;
      let tree = this._mapMap(treeBottomLayer, node => this._fileMetadataToNode(node, []));
      let currentLevel = maxLevel - 1;
      while (currentLevel >= minLevel) {
        const treeCurrentLayer = groupByDepthAndNode.get(currentLevel) as Map<string, FileMetadata[]>;
        tree = this._mapMap(treeCurrentLayer, node => this._fileMetadataToNode(node, tree.get(node.path) as FileNode[]));
        currentLevel -= 1;
      }

      return tree.get('/')!;
    }
    return [];
  }

  private _groupByDepth(arr: FileMetadata[]): Map<number, FileMetadata[]> {
    const res = new Map();
    arr.forEach(el => {
      const key = el.path.split('/').length;
      res.set(key, res.get(key) || []);
      res.get(key).push(el);
    });
    return res;
  }

  private _groupByDepthAndNode(group: Map<number, FileMetadata[]>): Map<number, Map<string, FileMetadata[]>> {
    return new Map(Array.from(group.entries())
      .map(pair => {
        const res = this._groupByNode(pair[1]);
        return [pair[0], res];
      }));
  }

  private _groupByNode(arr: FileMetadata[]): Map<string, FileMetadata[]> {
    const res = new Map();
    arr.forEach(el => {
      const lastIndex = this._lastIndexOf(el.path, '/');
      const key = lastIndex > 0 ? el.path.slice(0, lastIndex) : '/';
      res.set(key, res.get(key) || []);
      res.get(key).push(el);
    });
    return res;
  }

  private _lastIndexOf(str: string, searchTerm: string): number {
    let tmpIndex = str.indexOf(searchTerm);
    let lastIndex = tmpIndex;
    while (tmpIndex > -1) {
      lastIndex = tmpIndex;
      tmpIndex = str.indexOf(searchTerm, lastIndex + 1);
    }
    return lastIndex;
  }

  private _mapMap<T, U, V>(m: Map<T, U[]>, f: (v: U) => V): Map<T, V[]> {
    return new Map(Array.from(m.entries(), ([k, v]) => [k, v.map(f)]));
  }

  private _fileMetadataToNode(fileMetadata: FileMetadata, children: FileNode[]): FileNode {
    const fileNode = {
      isDirectory: fileMetadata.isDirectory,
      name: fileMetadata.name,
      creationDate: fileMetadata.creationDate,
      lastModificationDate: fileMetadata.lastModificationDate,
      size: fileMetadata.size
    };
    if (fileNode.isDirectory) {
      (fileNode as Directory).children = children || [];
    } else {
      (fileNode as SimpleFile).format = fileMetadata.format || '';
    }
    this._nodeMap.set(fileNode, fileMetadata);
    return fileNode;
  }

  private _hasChild(directoryNode: Directory): boolean {
    return directoryNode.children !== undefined && directoryNode.children.length > 0;
  }

  /** Checks all the parents when a leaf node is selected/unselected and return them */
  private _checkAllParentsSelection(node: FileFlatNode): FileFlatNode[] {
    const parents = [];
    let parent = this._getParentNode(node);
    while (parent) {
      this._checkRootNodeSelection(parent);
      parents.push(parent);
      parent = this._getParentNode(parent);
    }
    return parents;
  }

  /** Check root node checked state and change it accordingly */
  private _checkRootNodeSelection(node: FileFlatNode): void {
    const nodeSelected = this.selection.isSelected(node);
    const descendants = this.treeControl.getDescendants(node);
    const descAllSelected = descendants.length > 0 && descendants.every(child => this.selection.isSelected(child));
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
    return descendants.length > 0 && descendants.some(child => this.selection.isSelected(child));
  }

  private _descendantsOnlyOneOfHasUnresolvedThread(node: FileFlatNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    return descendants.length > 0 && descendants.some(child => this._hasUnresolvedThread(child));
  }

  private _hasUnresolvedThread(node: FileFlatNode): boolean {
    const comments = this._nodeMap.get(this._flatNodeMap.get(node)!)!.comments;
    if (!comments) {
      return false;
    } else {
      return comments.status === 'unresolved';
    }
  }

  private _getDescendantsOnlyCommentCount(node: FileFlatNode): number {
    const descendantCommentCounts = this.treeControl.getDescendants(node)
      .map(child => this._getCommentCount(child));
    return descendantCommentCounts.reduce((acc, currentValue) => acc + currentValue, 0);
  }

  private _getCommentCount(node: FileFlatNode): number {
    return (this._nodeMap.get(this._flatNodeMap.get(node)!)!.comments?.thread || []).length;
  }
}
