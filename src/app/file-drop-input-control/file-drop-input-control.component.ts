import {Component, forwardRef, Input} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';

declare global {
  interface File {
    webkitRelativePath: string;
    fullPath: string;
  }
}

export interface FileDropPackage {
  name: string;
  files: File[];
  directories: string[];
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
  @Input() label = '';

  constructor() {
    this.writeValue([]);
  }

  private _fileDropPackages!: FileDropPackage[];
  get fileDropPackages(): FileDropPackage[] {
    return this._fileDropPackages;
  }
  set fileDropPackages(fileDropPackages: FileDropPackage[]) {
    this._fileDropPackages = fileDropPackages;
    this.onChange(fileDropPackages);
  }

  onChange = (_: any) => {};

  onTouched = () => {};

  writeValue(fileDropPackages: FileDropPackage[]): void {
    this.fileDropPackages = fileDropPackages;
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
      this._handleFilesForDnD(ev.dataTransfer.items);
    }
  }

  handleFilesForInput(fileList: FileList | null): void {
    if (fileList) {
      const files = Array.from(fileList).map(file => {
        file.fullPath = file.webkitRelativePath;
        return file;
      });
      // TODO list directories to make it compatible with D&D + uncomment in html
      this.writeValue(this.fileDropPackages);
    }
  }

  remove(fileDropPackage: FileDropPackage): void {
    const index = this.fileDropPackages.indexOf(fileDropPackage);
    if (index >= 0) {
      this.fileDropPackages.splice(index, 1);
      this.writeValue(this.fileDropPackages);
    }
  }

  private _handleFilesForDnD(fileList: DataTransferItemList): void {
    const entries = Array.from(fileList)
      .filter(item => item.kind === 'file')
      .map(item => item.webkitGetAsEntry());
    entries.forEach(entry => {
      this._listFiles([entry], [], []).then((fileDropPackage: FileDropPackage) => {
        this.fileDropPackages.push(fileDropPackage);
        this.writeValue(this.fileDropPackages);
      });
    });
  }

  // FIXME types when they are implemented (e.g. FileSystemEntry)
  private _listFiles(entries: any[], files: File[], directories: string[]): Promise<FileDropPackage> {
    let name = '';
    const promises: Promise<any>[] = [];
    entries.forEach(entry => {
      if (entry.isFile) {
        const promise = this._parseFileEntry(entry).then(file => files.push(file));
        promises.push(promise);
      } else if (entry.isDirectory) {
        const promise = this._parseDirectoryEntry(entry, files, directories).then(_ => {});
        name = name || entry.name;
        directories.push(entry.fullPath);
        promises.push(promise);
      }
    });
    return Promise.all(promises).then(() => {
      return {
        name,
        files,
        directories,
        size: files
          .map(file => file.size)
          .reduce((acc, currentValue) => acc + currentValue, 0)
      };
    });
  }

  private _parseDirectoryEntry(directoryEntry: any, files: File[], directories: string[]): Promise<FileDropPackage> {
    const directoryReader = directoryEntry.createReader();
    return new Promise((resolve, reject) => {
      let allEntries: any[] = [];
      const readAllEntries = (entries: any[]) => {
        if (entries.length) {
          allEntries = allEntries.concat(entries);
          directoryReader.readEntries(readAllEntries);
        } else {
          resolve(this._listFiles(allEntries, files, directories));
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

  private _preventFileOpening(ev: Event): void {
    ev.stopPropagation();
    ev.preventDefault();
  }
}
