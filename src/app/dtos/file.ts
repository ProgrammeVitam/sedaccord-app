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

type Comments = {status: 'UNRESOLVED' | 'RESOLVED', thread: FileComment[]};

export interface FileMetadata extends FileInterface {
  path: string;
  comments?: Comments;
  newName?: string;
  description?: string;
  format?: string;
  startDate?: Date;
  endDate?: Date;
}
