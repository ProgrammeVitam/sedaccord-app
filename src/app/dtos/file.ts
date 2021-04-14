export interface FileInterface {
  isDirectory: boolean;
  name: string;
  creationDate: Date;
  lastModificationDate: Date;
  size: number;
}

export interface SimpleFile extends FileInterface {
  format: string;
}

export interface Directory extends FileInterface {
  children?: FileNode[];
}

export type FileNode = Directory | SimpleFile;
