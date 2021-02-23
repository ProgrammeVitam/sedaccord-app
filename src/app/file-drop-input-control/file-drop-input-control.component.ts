import {Component, forwardRef, Input} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';

declare global {
  interface File {
    webkitRelativePath: string;
  }
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

  private _files: File[];
  get files(): File[] {
    return this._files;
  }
  set files(files: File[]) {
    this._files = files;
    this.onChange(files);
  }

  onChange = (_: any) => {};
  onTouched = () => {};

  constructor() {
    this.writeValue([]);
  }

  writeValue(files: File[]): void {
    this.files = files;
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
    // this.handleFilesForDnD(ev.dataTransfer.items);
    this.handleFilesForDnD(ev.dataTransfer.files);
  }

  handleFilesForDnD(fileList: FileList): void { // FIXME use items and iterate through directories
    const files = Array.from(fileList);
    this._handleFiles(files);
  }

  handleFilesForInput(fileList: FileList): void { // FIXME
    const files = Array.from(fileList);
    const rootFile = new File(files, this._getRootDirectory(fileList[0])); // FIXME
    this._handleFiles([rootFile]);
  }

  remove(file: File): void { // FIXME
    const index = this.files.indexOf(file);
    if (index >= 0) {
      this.files.splice(index, 1);
      this.onChange(this.files);
    }
  }

  private _handleFiles(files: File[]): void {
    this.writeValue(this.files.concat(files));
  }

  private _getRootDirectory(file: File): string {
    return file.webkitRelativePath.split('/')[0];
  }

  private _preventFileOpening(ev: Event): void {
    ev.stopPropagation();
    ev.preventDefault();
  }
}
