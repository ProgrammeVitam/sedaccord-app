import {FlatTreeControl} from '@angular/cdk/tree';
import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {MatTreeFlatDataSource, MatTreeFlattener} from '@angular/material/tree';
import {SelectionModel} from '@angular/cdk/collections';
import {FileInterface, FileMetadata, FileUtil} from '../dtos/file';

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
  @Input() fileTreeData: FileMetadata[];
  @Input() focused;
  @Output() selectDirectoryEvent;

  treeControl: FlatTreeControl<FileFlatNode>;
  _treeFlattener: MatTreeFlattener<FileNode, FileFlatNode, FileFlatNode>;
  dataSource: MatTreeFlatDataSource<FileNode, FileFlatNode, FileFlatNode>;
  selection: SelectionModel<FileFlatNode>;

  /** Map from flat node to nested node. This helps us finding the nested node to be modified */
  private _flatNodeMap: Map<FileFlatNode, FileNode>;

  /** Map from nested node to flattened node. This helps us to keep the same object for selection */
  private _nestedNodeMap: Map<FileNode, FileFlatNode>;

  /** Map from nested node to file metadata. */
  private _nodeMap: Map<FileNode, FileMetadata>;

  constructor() {
    this.fileTreeData = [];
    this.focused = false;
    this.selectDirectoryEvent = new EventEmitter<FileTreeSelectionModel>();
    this.treeControl = new FlatTreeControl<FileFlatNode>(
      node => node.level,
      node => node.expandable
    );
    this._treeFlattener = new MatTreeFlattener(
      this._transformer,
      node => node.level,
      node => node.expandable,
      node => node.isDirectory ? (node as Directory).children : null
    );
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this._treeFlattener);
    this.selection = new SelectionModel<FileFlatNode>(false);
    this._flatNodeMap = new Map<FileFlatNode, FileNode>();
    this._nestedNodeMap = new Map<FileNode, FileFlatNode>();
    this._nodeMap = new Map<FileNode, FileMetadata>();
  }

  hasChild = (_: number, node: FileFlatNode) => node.expandable;

  getLevel = (node: FileFlatNode) => node.level;

  ngOnInit(): void {
    this.dataSource.data = this._buildTreeFromMaterialized(this.fileTreeData);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.focused && !this.focused) {
      this.selection.clear();
    }
  }

  descendantsHaveUnresolvedThread(node: FileFlatNode): boolean {
    return this._descendantsOnlyOneOfHasUnresolvedThread(node);
  }

  descendantsHaveComment(node: FileFlatNode): boolean {
    return this._getDescendantsOnlyCommentCount(node) > 0;
  }

  isSelected(node: FileFlatNode): boolean {
    return this._descendantsOneOfSelected(node);
  }

  isDirectory(node: FileFlatNode): boolean {
    return this._flatNodeMap.get(node)!.isDirectory;
  }

  /** Select a directory. Check all the parents to see if they changed */
  selectFile(node: FileFlatNode): void {
    if (this.isDirectory(node)) {
      this.selection.select(node);
      const parents = this._checkAllParentsSelection(node)
        .map(parent => this._nodeMap.get(this._flatNodeMap.get(parent)!)!)
        .concat([this._nodeMap.get(this._flatNodeMap.get(node)!)!]);
      const directory = this._flatNodeMap.get(node) as Directory;
      const children = (directory.children || [])
        .map(fileNode => this._nodeMap.get(fileNode)!);
      this.selectDirectoryEvent.emit({parents, children});
    }
  }

  addFile(): void {
    // TODO
  }

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

  private _hasChild(directory: Directory): boolean {
    return directory.children !== undefined && !!directory.children.length;
  }

  private _buildTreeFromMaterialized(data: FileMetadata[]): FileNode[] {
    if (data.length) {
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

  private _groupByDepth(dataArray: FileMetadata[]): Map<number, FileMetadata[]> {
    const res = new Map();
    dataArray.forEach(el => {
      const key = el.path.split('/').length;
      res.set(key, res.get(key) || []);
      res.get(key).push(el);
    });
    return res;
  }

  private _groupByDepthAndNode(dataGroup: Map<number, FileMetadata[]>): Map<number, Map<string, FileMetadata[]>> {
    return new Map(Array.from(dataGroup.entries())
      .map(pair => {
        const res = this._groupByNode(pair[1]);
        return [pair[0], res];
      }));
  }

  private _groupByNode(dataArray: FileMetadata[]): Map<string, FileMetadata[]> {
    const res = new Map();
    dataArray.forEach(el => {
      const lastIndex = this._lastIndexOf(el.path, '/');
      const key = lastIndex > 0 ? el.path.slice(0, lastIndex) : '/';
      res.set(key, res.get(key) || []);
      res.get(key).push(el);
    });
    return res;
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

  private _mapMap<T, U, V>(m: Map<T, U[]>, f: (v: U) => V): Map<T, V[]> {
    return new Map(Array.from(m.entries(), ([k, v]) => [k, v.map(f)]));
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
    const descAllSelected = descendants.length && descendants.every(child => this.selection.isSelected(child));
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

  private _descendantsOnlyOneOfHasUnresolvedThread(node: FileFlatNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    return !!descendants.length && descendants
      .some(child => FileUtil.hasUnresolvedThread(this._nodeMap.get(this._flatNodeMap.get(child)!)!));
  }

  private _getDescendantsOnlyCommentCount(node: FileFlatNode): number {
    const directDescendantCommentCounts = this.treeControl.getDescendants(node)
      .map(child => FileUtil.getCommentCount(this._nodeMap.get(this._flatNodeMap.get(child)!)!));
    return directDescendantCommentCounts.reduce((acc, currentValue) => acc + currentValue, 0);
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
    return !!descendants.length && descendants.some(child => this.selection.isSelected(child));
  }
}
