import {ArchiveDataPackage, ArchiveTransfer, FileMetadata} from './archive-transfer';

interface ArchiveUnitData {
  archiveUnitID: string;
  descriptionLevel: 'RecordGrp' | 'Item';
  title: string;
  description: string;
  path?: string;
}

interface SipDataInterface {
  comment: string;
  messageIdentifier: string;
  archivalAgreement: string;

  archivalAgency: string;
  transferringAgency: string;
  originatingAgency: string;
  submissionAgency: string;

  archiveUnitDataList: ArchiveUnitData[];
}

export class SipData implements SipDataInterface {

  constructor() {
    this.comment = '';
    this.messageIdentifier = '';
    this.archivalAgreement = '';
    this.archivalAgency = '';
    this.transferringAgency = '';
    this.originatingAgency = '';
    this.submissionAgency = '';
    this.archiveUnitDataList = [];
  }
  comment: string;
  messageIdentifier: string;
  archivalAgreement: string;
  archivalAgency: string;
  transferringAgency: string;
  originatingAgency: string;
  submissionAgency: string;
  archiveUnitDataList: ArchiveUnitData[];

  static fromArchiveTransfer(archiveTransfer: ArchiveTransfer): SipData {
    return new SipData()
      .withComment(`${archiveTransfer.name}\n${archiveTransfer.description}\n${archiveTransfer.startDate}\n${archiveTransfer.endDate}\n${archiveTransfer.originatingAgency?.description}\n${archiveTransfer.submissionAgency?.description}`)
      .withMessageIdentifier(`Projet de versement ${archiveTransfer.id}`)
      .withArchivalAgreement('IC-000001') // TODO
      .withArchivalAgency('') // TODO
      .withTransferringAgency(archiveTransfer.originatingAgency?.name || '')
      .withOriginatingAgency(archiveTransfer.originatingAgency?.name || '')
      .withSubmissionAgency(archiveTransfer.submissionAgency?.name || '')
      .withArchiveUnits(this.archiveDataPackagesToArchiveUnits(archiveTransfer.archiveDataPackages));
  }

  private static archiveDataPackagesToArchiveUnits(archiveDataPackages: ArchiveDataPackage[]): ArchiveUnitData[] {
    return archiveDataPackages.flatMap(archiveDataPackage => {
      const archiveUnitId = `${archiveDataPackage.id}`;
      const metaArchiveUnit: ArchiveUnitData = {
        archiveUnitID: archiveUnitId,
        descriptionLevel: 'RecordGrp',
        title: `${archiveDataPackage.name} ${archiveDataPackage.classificationItem.name}`,
        description: archiveDataPackage.description || ''
      };
      const archiveUnits = archiveDataPackage.archiveData
        .map(archiveData => {
          const root = this._getRoot(archiveData);
          return {
            archiveUnitID: archiveUnitId,
            descriptionLevel: 'RecordGrp',
            title: root.name,
            description: root.description || '',
            path: `/home/helene/Desktop${root.path}` // TODO
          } as ArchiveUnitData;
        });
      return [metaArchiveUnit, ...archiveUnits];
    });
  }

  private static _getRoot(archiveData: FileMetadata[]): FileMetadata {
    return archiveData.reduce((acc, currentValue) =>
      this._getLength(currentValue) < this._getLength(acc) ? currentValue : acc);
  }

  private static _getLength(currentValue: FileMetadata): number {
    return currentValue.path.split('/').length;
  }

  withComment(value: string): SipData {
    this.comment = value;
    return this;
  }

  withMessageIdentifier(value: string): SipData {
    this.messageIdentifier = value;
    return this;
  }

  withArchivalAgreement(value: string): SipData {
    this.archivalAgreement = value;
    return this;
  }

  withArchivalAgency(value: string): SipData {
    this.archivalAgency = value;
    return this;
  }

  withOriginatingAgency(value: string): SipData {
    this.originatingAgency = value;
    return this;
  }

  withSubmissionAgency(value: string): SipData {
    this.submissionAgency = value;
    return this;
  }

  withTransferringAgency(value: string): SipData {
    this.transferringAgency = value;
    return this;
  }

  withArchiveUnits(value: ArchiveUnitData[]): SipData {
    this.archiveUnitDataList.push(...value);
    return this;
  }
}
