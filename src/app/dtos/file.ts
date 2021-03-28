export interface FileInterface {
  isDirectory: boolean;
  name: string;
  creationDate: Date;
  lastModificationDate: Date;
  size: number;
  format?: string;
}

export interface Directory extends FileInterface {
  children?: FileNode[];
}

export type FileNode = Directory | FileInterface;
