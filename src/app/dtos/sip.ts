import {ArchiveDataPackage, ArchiveDataUtils, ArchiveTransfer} from './archive-transfer';
import {LOCAL_STORAGE_PATH} from '../services/sip.service';

interface ArchiveUnitData {
  archiveUnitID: string;
  descriptionLevel: 'RecordGrp' | 'Item';
  title: string;
  description: string;
  startDate?: string;
  endDate?: string;
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
  public comment: string;
  public messageIdentifier: string;
  public archivalAgreement: string;
  public archivalAgency: string;
  public transferringAgency: string;
  public originatingAgency: string;
  public submissionAgency: string;
  public archiveUnitDataList: ArchiveUnitData[];

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

  static fromArchiveTransfer(archiveTransfer: ArchiveTransfer): SipData {
    return new SipData()
      .withComment(`
        ${archiveTransfer.name}\n
        Description: ${archiveTransfer.description}\n
        Date de début: ${archiveTransfer.startDate}\n
        Date de fin: ${archiveTransfer.endDate}\n
        Service producteur: ${archiveTransfer.originatingAgency?.description}\n
        Service versant: ${archiveTransfer.submissionAgency?.description}
      `)
      .withMessageIdentifier(`Projet de versement ${archiveTransfer.id}`)
      .withArchivalAgreement('IC-000001') // TODO
      .withArchivalAgency('Vitam') // TODO
      .withTransferringAgency(archiveTransfer.originatingAgency?.name || '')
      .withOriginatingAgency(archiveTransfer.originatingAgency?.name || '')
      .withSubmissionAgency(archiveTransfer.submissionAgency?.name || '')
      .withArchiveUnits(this._archiveDataPackagesToArchiveUnits(archiveTransfer.archiveDataPackages));
  }

  private static _archiveDataPackagesToArchiveUnits(archiveDataPackages: ArchiveDataPackage[]): ArchiveUnitData[] {
    return archiveDataPackages.flatMap(archiveDataPackage => {
      const archiveUnitId = `${archiveDataPackage.id}`;
      const metaArchiveUnit: ArchiveUnitData = {
        archiveUnitID: archiveUnitId,
        descriptionLevel: 'RecordGrp',
        title: `${archiveDataPackage.name} ${archiveDataPackage.classificationItem.name}`,
        description: archiveDataPackage.description || ''
      };
      const archiveUnits = ArchiveDataUtils.getRoots(archiveDataPackage.archiveData)
        .map(root => { return {
            archiveUnitID: archiveUnitId,
            descriptionLevel: 'RecordGrp',
            title: root.name,
            description: root.description || '',
            startDate: root.startDate?.toUTCString(), // TODO missing backend side
            endDate: root.endDate?.toUTCString(), // TODO missing backend side
            path: `${LOCAL_STORAGE_PATH}${root.path}`
          } as ArchiveUnitData; });
      return [metaArchiveUnit, ...archiveUnits];
    });
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
