interface SedaMetadata {
  description?: string;
}

export interface FileComment {
  date: Date;
  user: string;
  text: string;
  file: string;
}

interface FileInterface { // TODO should it contain data attribute? Is it file metadata interface only?
  isDirectory: boolean;
  name: string;
  startDate: Date;
  endDate: Date;
  size: number;
  metadata?: SedaMetadata;
}

export interface Directory extends FileInterface {
  children?: FileNode[];
}

export interface SimpleFile extends FileInterface {
  format: string;
}

export type FileNode = Directory | SimpleFile; // FIXME?
