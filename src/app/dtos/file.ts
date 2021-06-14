export interface FileInterface {
  isDirectory: boolean;
  name: string;
  creationDate: Date;
  lastModificationDate: Date;
  size: number;
}

interface FileComment {
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

export class FileUtil {
  static hasUnresolvedThread(fileMetadata: FileMetadata): boolean {
    return !!fileMetadata.comments && fileMetadata.comments.status === 'UNRESOLVED';
  }

  static getCommentCount(fileMetadata: FileMetadata): number {
    return (fileMetadata.comments?.thread || []).length;
  }
}
