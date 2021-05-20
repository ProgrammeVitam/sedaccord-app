import {Injectable} from '@angular/core';
import {InMemoryDbService} from 'angular-in-memory-web-api';
import {ArchiveDataPackage, ArchiveTransfer} from '../dtos/archive-transfer';
import {Agency, ClassificationItemNode} from '../dtos/referential';
import {FileMetadata} from '../dtos/file';
import {User} from '../dtos/user';

@Injectable({
  providedIn: 'root'
})
export class InMemoryDataService implements InMemoryDbService {

  constructor() {
  }

  createDb() {
    const agencies: Agency[] = [
      {id: 1, name: 'DGT', description: 'Direction générale du travail'},
      {id: 2, name: 'DGAS', description: 'Direction générale de l\'action sociale'},
      {id: 3, name: 'DGOS', description: 'Direction générale de l\'offre de soin'},
      {id: 4, name: 'DGCS', description: 'Direction générale de la cohésion sociale'},
      {id: 5, name: 'DRH', description: 'Direction des ressources humaines'}
    ];
    const classification: ClassificationItemNode[] = [
      {
        id: 1,
        name: 'Gestion individuelle',
        children: [
          {id: 11, name: 'Dossiers de carrière'},
          {id: 12, name: 'Dossiers d’accidents du travail'},
          {id: 13, name: 'Dossiers de pension et réversion'},
          {id: 14, name: 'Dossiers de paie'},
          {id: 15, name: 'Dossiers individuels du comité médical supérieur'},
          {id: 16, name: 'Dossiers médicaux'}]
      },
      {
        id: 2,
        name: 'Gestion collective',
        children: [
          {id: 21, name: 'Commissions et comités'},
          {id: 22, name: 'Effectifs'},
          {
            id: 23,
            name: 'Action sociale en faveur des agents',
            children: [{id: 231, name: 'Politique d’action sociale'}, {id: 232, name: 'Prestations sociales'}]
          },
          {id: 24, name: 'Recrutements et concours'},
          {id: 25, name: 'Formation Relation avec les syndicats'}
        ]
      }
    ];
    const data1: FileMetadata[][] = [
      [{
        isDirectory: true,
        name: 'Agents partis en janvier 2017',
        creationDate: new Date(2017, 0, 1),
        lastModificationDate: new Date(2020, 0, 31),
        size: 948.55,
        path: '/Agents partis en janvier 2017'
      }],
      [{
        isDirectory: true,
        name: 'Agents partis en février 2017',
        creationDate: new Date(2020, 1, 1),
        lastModificationDate: new Date(2020, 1, 28),
        size: 948.55,
        path: '/Agents partis en février 2017'
      }],
      [{
        isDirectory: true,
        name: 'Agents partis en mars 2017',
        creationDate: new Date(2017, 2, 1),
        lastModificationDate: new Date(2017, 2, 31),
        size: 948.55,
        path: '/Agents partis en mars 2017'
      }],
      [{
        isDirectory: true,
        name: 'Agents partis en avril 2017',
        creationDate: new Date(2017, 3, 1),
        lastModificationDate: new Date(2017, 3, 30),
        size: 948.55,
        path: '/Agents partis en avril 2017'
      },
      {
        isDirectory: true,
        name: 'Agents_A',
        creationDate: new Date(2017, 3, 1),
        lastModificationDate: new Date(2017, 3, 30),
        size: 948.55,
        path: '/Agents partis en avril 2017/Agents_A'
      },
      {
        isDirectory: true,
        name: 'Agents_B',
        creationDate: new Date(2017, 3, 1),
        lastModificationDate: new Date(2017, 3, 30),
        size: 948.55,
        path: '/Agents partis en avril 2017/Agents_B'
      },
      {
        isDirectory: true,
        name: 'Agents_C',
        creationDate: new Date(2017, 3, 1),
        lastModificationDate: new Date(2017, 3, 30),
        size: 948.55,
        path: '/Agents partis en avril 2017/Agents_C'
      },
      {
        isDirectory: true,
        name: 'CARPENTAS Isabelle',
        creationDate: new Date(2020, 11, 22, 15, 0, 0),
        lastModificationDate: new Date(2020, 11, 22, 15, 0, 0),
        size: 948.55,
        path: '/Agents partis en avril 2017/Agents_C/CARPENTAS Isabelle'
      },
      {
        isDirectory: true,
        name: 'CHAMONIX Jean-Marc',
        creationDate: new Date(2020, 11, 22, 15, 0, 0),
        lastModificationDate: new Date(2020, 11, 22, 15, 0, 0),
        size: 948.55,
        path: '/Agents partis en avril 2017/Agents_C/CHAMONIX Jean-Marc'
      },
      {
        isDirectory: true,
        name: 'CRIPOUX Sarah',
        creationDate: new Date(2020, 11, 22, 15, 0, 0),
        lastModificationDate: new Date(2020, 11, 22, 15, 0, 0),
        size: 948.55,
        path: '/Agents partis en avril 2017/Agents_C/CRIPOUX Sarah'
      },
      {
        isDirectory: false,
        name: 'CV',
        creationDate: new Date(2010, 3, 2),
        lastModificationDate: new Date(2010, 3, 2),
        size: 948.55,
        format: 'PDF',
        path: '/Agents partis en avril 2017/Agents_C/CRIPOUX Sarah/CV.pdf'
      },
      {
        isDirectory: false,
        name: 'CR_evaluation_2015',
        creationDate: new Date(2015, 0, 11),
        lastModificationDate: new Date(2015, 0, 11),
        size: 948.55,
        format: 'docx',
        path: '/Agents partis en avril 2017/Agents_C/CRIPOUX Sarah/CR_evaluation_2015.docx'
      },
      {
        isDirectory: false,
        name: 'Arrêté de nomination',
        creationDate: new Date(2014, 2, 31),
        lastModificationDate: new Date(2014, 2, 31),
        size: 948.55,
        format: 'docx',
        path: '/Agents partis en avril 2017/Agents_C/CRIPOUX Sarah/Arrêté de nomination.docx'
      },
      {
        isDirectory: false,
        name: '2011_07_26_attestation_formation_gestes_posture',
        creationDate: new Date(2011, 6, 26),
        lastModificationDate: new Date(2011, 6, 26),
        size: 948.55,
        format: 'docx',
        path: '/Agents partis en avril 2017/Agents_C/CRIPOUX Sarah/2011_07_26_attestation_formation_gestes_posture.docx'
      },
      {
        isDirectory: false,
        name: 'Evaluation_2016_CR',
        creationDate: new Date(2014, 0, 6),
        lastModificationDate: new Date(2014, 0, 6),
        size: 948.55,
        format: 'rtf',
        path: '/Agents partis en avril 2017/Agents_C/CRIPOUX Sarah/Evaluation_2016_CR.rtf',
        comments: {
          status: 'unresolved',
          thread: [
            {
              date: new Date(2021, 0, 28, 15, 0, 0),
              username: 'Patrick Dupont',
              text: 'J\'ai un doute sur le format de ce fichier, convient-il pour le versement ?'
            },
            {
              date: new Date(2021, 1, 5, 15, 0, 0),
              username: 'Sophie Bertrand',
              text: 'Oui, il convient tout à fait.'
            }
          ]
        }
      }]
    ];
    const transfer1 = {
      id: 1,
      creationDate: new Date(2021, 0, 1),
      lastModificationDate: new Date(2021, 1, 11),
      status: 'En cours',
      name: 'Dossiers de carrière - Agents partis en 2017 et 2018',
      description: 'Dossiers de carrière d’agents du ministère des affaires sociales ayant quitté leurs fonctions en 2017 et 2018. Les dossiers sont classés par mois puis par ordre alphabétique.',
      startDate: new Date(1978, 0, 11),
      endDate: new Date(2018, 10, 27),
      originatingAgency: agencies[4],
      submissionAgency: agencies[4],
      archiveDataPackages: [{
        id: 1,
        name: '',
        classificationItem: classification[0].children![0],
        archiveData: data1
      }]
    } as ArchiveTransfer;
    const transfer2 = {
      id: 2,
      creationDate: new Date(2021, 0, 2),
      lastModificationDate: new Date(2021, 0, 1),
      status: 'En cours',
      name: 'Dossiers médicaux – Agents partis en 2018',
      description: 'Dossiers médicaux des agents du ministère des affaires sociales ayant quitté leurs fonctions en 2018. Les dossiers sont classés par mois puis par ordre alphabétique.',
      startDate: new Date(1965, 0, 4),
      endDate: new Date(2018, 7, 18),
      originatingAgency: agencies[4],
      submissionAgency: agencies[4],
      archiveDataPackages: [] as ArchiveDataPackage[]
    } as ArchiveTransfer;
    const archiveTransfers: ArchiveTransfer[] = [
      transfer1,
      transfer2
    ];
    const users: User[] = [
      {
        id: 1,
        name: 'Sophie Bertrand',
        role: 'archive'
      },
      {
        id: 2,
        name: 'Patrick Dupont',
        role: 'transfer'
      }
    ];
    return {
      agencies,
      classification,
      archiveTransfers,
      users
    };
  }

  // Overrides the genId method to ensure that an archive transfer always has an id.
  // If the archive transfers array is empty,
  // the method below returns the initial number (1).
  // if the archive transfers array is not empty, the method below returns the highest
  // archive transfer id + 1.
  genId(archiveTransfers: ArchiveTransfer[]): number {
    return archiveTransfers.length > 0 ? Math.max(...archiveTransfers.map(archiveTransfer => archiveTransfer.id!)) + 1 : 1;
  }
}
