import {FileNode} from './file';

interface ClassificationItem {
  id: number;
  name: string;
}

export interface ClassificationItemNode extends ClassificationItem {
  children?: ClassificationItemNode[];
}

export interface Office {
  id: number;
  name: string;
  description: string;
}

export interface ArchiveDataPackage {
  id: number;
  name: string;
  classificationItem: ClassificationItem;
  fileTreeData: FileNode[];
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
  transferringAgency?: Office;
  creator?: Office;
  archiveDataPackages?: ArchiveDataPackage[];
}

export class ArchiveTransfer implements ArchiveTransferInterface {
  public creationDate: Date;
  public lastModificationDate: Date;
  public status: string;
  public transferringAgency?: Office;
  public creator?: Office;
  public archiveDataPackages: ArchiveDataPackage[] = [];

  constructor(
    public id: number,
    public name: string,
    public description?: string,
    public startDate?: Date,
    public endDate?: Date,
    transferringAgency?: Office,
    creator?: Office
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
    this.transferringAgency = transferringAgency ?? undefined;
    this.creator = creator ?? undefined;
  }

  addPackage(id: number, name: string, classificationItem: ClassificationItem, fileTreeData: FileNode[]): void {
    const newArchiveDataPackage = {
      id,
      name,
      classificationItem: classificationItem ?? null,
      fileTreeData
    };
    this.archiveDataPackages.push(newArchiveDataPackage);
  }

  submit(): void {
    this.status = 'En attente de correction';
  }
}
