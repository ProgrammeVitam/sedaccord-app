import {Component, forwardRef, Input} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {Utils} from '../shared/utils';

declare global {
  interface File {
    webkitRelativePath: string;
    fullPath: string;
  }
}

interface FilePackage {
  root: string;
  files: File[];
  size: number;
}

@Component({
  selector: 'app-file-drop',
  templateUrl: './file-drop-input-control.component.html',
  styleUrls: ['./file-drop-input-control.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => FileDropInputControlComponent),
    multi: true
  }]
})
export class FileDropInputControlComponent implements ControlValueAccessor {
  @Input() disabled = false;

  private _filePackages!: FilePackage[];
  get filePackages(): FilePackage[] {
    return this._filePackages;
  }
  set filePackages(filePackages: FilePackage[]) {
    this._filePackages = filePackages;
    this.onChange(filePackages);
  }

  onChange = (_: any) => {};
  onTouched = () => {};

  constructor() {
    this.writeValue([]);
  }

  writeValue(filePackages: FilePackage[]): void {
    this.filePackages = filePackages;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onDragover(ev: Event): void {
    this._preventFileOpening(ev);
  }

  onDrop(ev: DragEvent): void {
    this._preventFileOpening(ev);
    if (ev.dataTransfer) {
      // this.handleFilesForDnD(ev.dataTransfer.files);
      this._handleFilesForDnD(ev.dataTransfer.items);
    }
  }

  handleFilesForInput(fileList: FileList | null): void {
    if (fileList) {
      const files = Array.from(fileList).map(file => {
        file.fullPath = file.webkitRelativePath;
        return file;
      });
      this._handleFiles(files);
    }
  }

  remove(filePackage: FilePackage): void { // FIXME
    const index = this.filePackages.indexOf(filePackage);
    if (index >= 0) {
      this.filePackages.splice(index, 1);
      this.onChange(this.filePackages);
    }
  }

  private _handleFilesForDnD(fileList: DataTransferItemList): void {
    const entries = Array.from(fileList)
      .filter(item => item.kind === 'file')
      .map(item => item.webkitGetAsEntry());
    this._listFiles(entries, []).then(files => {
      this._handleFiles(files);
    });
  }

  // FIXME types when they are implemented (e.g. FileSystemEntry)
  private _listFiles(entries: any[], files: File[]): Promise<File[]> {
    const promises: Promise<any>[] = [];
    entries.forEach(entry => {
      if (entry.isFile) {
        const promise = this._parseFileEntry(entry).then(file => {
          files.push(file);
        });
        promises.push(promise);
      } else if (entry.isDirectory) {
        const promise = this._parseDirectoryEntry(entry, files);
        promises.push(promise);
      }
    });
    return Promise.all(promises).then(() => files);
  }

  private _parseDirectoryEntry(directoryEntry: any, files: File[]): Promise<any> {
    const directoryReader = directoryEntry.createReader();
    return new Promise((resolve, reject) => {
      let allEntries: any[] = [];
      const readAllEntries = (entries: any[]) => {
        if (entries.length > 0) {
          allEntries = allEntries.concat(entries);
          directoryReader.readEntries(readAllEntries);
        } else {
          resolve(this._listFiles(allEntries, files));
        }
      };
      directoryReader.readEntries(
        readAllEntries,
        (err: Error) => {
          reject(err);
        }
      );
    });
  }

  private async _parseFileEntry(fileEntry: any): Promise<File> {
    return new Promise((resolve, reject) => {
      fileEntry.file(
        (file: File) => {
          file.fullPath = fileEntry.fullPath;
          resolve(file);
        },
        (err: Error) => {
          reject(err);
        }
      );
    });
  }

  private _handleFiles(files: File[]): void {
    files.forEach(file => {
      const root = file.fullPath.split('/')[1];
      const filePackage = Utils.findUniqueInArray(this.filePackages, p => root === p.root);
      if (filePackage) {
        filePackage.files.push(file);
        filePackage.size += file.size;
      } else {
        this.filePackages.push({
          root,
          files: [file],
          size: file.size
        });
      }
    });
    this.writeValue(this.filePackages);
  }

  private _preventFileOpening(ev: Event): void {
    ev.stopPropagation();
    ev.preventDefault();
  }
}
