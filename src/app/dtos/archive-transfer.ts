import {Agency, Reference} from './referential';
import {FileInterface} from './file';

export interface FileComment { // FIXME
  date: Date;
  user: string;
  text: string;
  file: string;
}

export interface FileMetadata extends FileInterface {
  path: string;
}

export interface ArchiveDataPackage {
  id: number;
  name: string;
  classificationItem: Reference;
  archiveData: FileMetadata[];
}

interface ArchiveTransferInterface {
  id: number;
  creationDate: Date;
  lastModificationDate: Date;
  status: string;
  name: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  originatingAgency?: Agency;
  submissionAgency?: Agency;
  archiveDataPackages?: ArchiveDataPackage[];
}

export class ArchiveTransfer implements ArchiveTransferInterface {
  public creationDate: Date;
  public lastModificationDate: Date;
  public status: string;
  public originatingAgency?: Agency;
  public submissionAgency?: Agency;
  public archiveDataPackages: ArchiveDataPackage[] = [];

  constructor(
    public id: number,
    public name: string,
    public description?: string,
    public startDate?: Date,
    public endDate?: Date,
    originatingAgency?: Agency,
    submissionAgency?: Agency
  ) {
    this.id = id;
    this.creationDate = new Date();
    this.lastModificationDate = this.creationDate;
    this.status = 'En cours';
    this.archiveDataPackages = [];
    this.name = name;
    this.description = description ?? '';
    this.startDate = startDate ?? undefined;
    this.endDate = endDate ?? undefined;
    this.originatingAgency = originatingAgency ?? undefined;
    this.submissionAgency = submissionAgency ?? undefined;
  }

  addPackage(id: number, name: string, classificationItem: Reference, archiveData: FileMetadata[]): void {
    const newArchiveDataPackage = {
      id,
      name,
      classificationItem: classificationItem ?? null,
      archiveData
    };
    this.archiveDataPackages.push(newArchiveDataPackage);
  }

  submit(): void {
    this.status = 'En attente de correction';
  }
}
