import {Agency, Reference} from './referential';
import {FileMetadata} from './file';
import {ANONYMOUS_USER} from '../services/auth.service';

export class ArchiveDataUtils {
  static getRoots(archiveData: ArchiveData): FileMetadata[] {
    return archiveData.map(data => this._getRoot(data));
  }

  private static _getRoot(flatArchiveData: FileMetadata[]): FileMetadata {
    return flatArchiveData.reduce((acc, currentValue) =>
      this._getLength(currentValue) < this._getLength(acc) ? currentValue : acc);
  }

  private static _getLength(fileMetadata: FileMetadata): number {
    return fileMetadata.path.split('/').length;
  }
}

export type ArchiveData = FileMetadata[][];

export interface ArchiveDataPackage {
  id: number;
  name: string;
  description?: string;
  classificationItem: Reference;
  archiveData: ArchiveData;
}

export type ArchiveTransferStatus = 'En cours' | 'En attente de correction';

export interface ArchiveTransferInterface {
  id: number | undefined;
  creationDate: string;
  lastModificationDate: string;
  status: ArchiveTransferStatus;
  submissionUserId: number;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  originatingAgency?: Agency;
  submissionAgency?: Agency;
  archiveDataPackages: ArchiveDataPackage[];
}

const NULL_ID = 0;

export class ArchiveTransfer {
  private _id: number;
  get id(): number {
    return this._id;
  }

  private _creationDate: Date;
  get creationDate(): Date {
    return this._creationDate;
  }

  private _lastModificationDate: Date;
  get lastModificationDate(): Date {
    return this._lastModificationDate;
  }

  private _status: ArchiveTransferStatus;
  get status(): ArchiveTransferStatus {
    return this._status;
  }

  submissionUserId: number;
  name: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  originatingAgency?: Agency;
  submissionAgency?: Agency;
  archiveDataPackages: ArchiveDataPackage[];

  constructor() {
    this._id = NULL_ID;
    this._creationDate = new Date();
    this._lastModificationDate = this.creationDate;
    this._status = 'En cours';
    this.submissionUserId = ANONYMOUS_USER.id;
    this.name = '';
    this.archiveDataPackages = [];
  }

  fromObject(archiveTransferObject: ArchiveTransferInterface): ArchiveTransfer {
    this._id = archiveTransferObject.id || NULL_ID;
    this._creationDate = new Date(archiveTransferObject.creationDate);
    this._lastModificationDate = new Date(archiveTransferObject.lastModificationDate);
    this._status = archiveTransferObject.status;
    this._status = archiveTransferObject.status;
    this.submissionUserId = archiveTransferObject.submissionUserId;
    this.name = archiveTransferObject.name;
    this.description = archiveTransferObject.description;
    this.startDate = archiveTransferObject.startDate ? new Date(archiveTransferObject.startDate) : undefined;
    this.endDate = archiveTransferObject.endDate ? new Date(archiveTransferObject.endDate) : undefined;
    this.originatingAgency = archiveTransferObject.originatingAgency;
    this.submissionAgency = archiveTransferObject.submissionAgency;
    this.archiveDataPackages = archiveTransferObject.archiveDataPackages;
    return this;
  }

   toInterface(): ArchiveTransferInterface {
    return {
      id: this._id > 0 ? this._id : undefined,
      creationDate: this._creationDate.toDateString(),
      lastModificationDate: this._lastModificationDate.toDateString(),
      status: this._status,
      submissionUserId: this.submissionUserId,
      name: this.name,
      description: this.description,
      startDate: this.startDate && this.startDate.toDateString(),
      endDate: this.endDate && this.endDate.toDateString(),
      originatingAgency: this.originatingAgency,
      submissionAgency: this.submissionAgency,
      archiveDataPackages: this.archiveDataPackages
    };
  }

  withName(value: string): ArchiveTransfer {
    this.name = value;
    return this;
  }

  withDescription(value: string): ArchiveTransfer {
    this.description = value;
    return this;
  }

  withStartDate(value: Date): ArchiveTransfer {
    this.startDate = value;
    return this;
  }

  withEndDate(value: Date): ArchiveTransfer {
    this.endDate = value;
    return this;
  }

  withOriginatingAgency(value: Agency): ArchiveTransfer {
    this.originatingAgency = value;
    return this;
  }

  withSubmissionAgency(value: Agency): ArchiveTransfer {
    this.submissionAgency = value;
    return this;
  }

  withArchiveDataPackages(value: ArchiveDataPackage[]): ArchiveTransfer {
    this.archiveDataPackages.push(...value);
    return this;
  }

  share(): void {
    this._status = 'En attente de correction';
  }

  update(): void {
    this._lastModificationDate = new Date();
  }
}
