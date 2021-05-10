export interface FileInterface {
  isDirectory: boolean;
  name: string;
  creationDate: Date;
  lastModificationDate: Date;
  size: number;
}

export interface FileComment {
  date: Date;
  username: string;
  text: string;
}

export interface FileMetadata extends FileInterface {
  path: string;
  comments?: FileComment[];
  newName?: string;
  description?: string;
  format?: string;
  startDate?: Date;
  endDate?: Date;
}
