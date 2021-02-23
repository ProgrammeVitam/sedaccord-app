import {Injectable} from '@angular/core';
import {InMemoryDbService} from "angular-in-memory-web-api";
import {ArchiveTransfer, ClassificationItemNode, Office} from "../dtos/archive-transfer";
import {FileNode} from "../dtos/file";

@Injectable({
  providedIn: 'root'
})
export class InMemoryDataService implements InMemoryDbService {

  constructor() {
  }

  createDb() {
    const transferringAgencies: Office[] = [
      {id: 1, name: "DGT", description: "Direction générale du travail"},
      {id: 2, name: "DGAS", description: "Direction générale de l'action sociale"},
      {id: 3, name: "DGOS", description: "Direction générale de l'offre de soin"},
      {id: 4, name: "DGCS", description: "Direction générale de la cohésion sociale"},
      {id: 5, name: "DFAS.SDSGI.ARCH", description: "Bureau des archives"}
    ];
    const creators: Office[] = [
      {id: 1, name: "DGT", description: "Direction générale du travail"},
      {id: 2, name: "DGAS", description: "Direction générale de l'action sociale"},
      {id: 3, name: "DGOS", description: "Direction générale de l'offre de soin"},
      {id: 4, name: "DGCS", description: "Direction générale de la cohésion sociale"},
      {id: 5, name: "DFAS.SDSGI.ARCH", description: "Bureau des archives"}
    ];
    const classification: ClassificationItemNode[] = [
      {
        id: 1,
        name: "Gestion individuelle",
        children: [
          {id: 11, name: "Dossiers de carrière"},
          {id: 12, name: "Dossiers d’accidents du travail"},
          {id: 13, name: "Dossiers de pension et réversion"},
          {id: 14, name: "Dossiers de paie"},
          {id: 15, name: "Dossiers individuels du comité médical supérieur"}]
      },
      {
        id: 2,
        name: "Gestion collective",
        children: [
          {id: 21, name: "Commissions et comités"},
          {id: 22, name: "Effectifs"},
          {
            id: 23,
            name: "Action sociale en faveur des agents",
            children: [{id: 231, name: "Politique d’action sociale"}, {id: 232, name: "Prestations sociales"}]
          },
          {id: 24, name: "Recrutements et concours"},
          {id: 25, name: "Formation Relation avec les syndicats"}
        ]
      }
    ];
    const fileTreeData1: FileNode[] = [
      {
        isDirectory: true,
        name: "Dossier #A",
        startDate: new Date(2020, 11, 22, 15, 0, 0),
        endDate: new Date(2020, 11, 22, 15, 0, 0),
        size: 948.55
      },
      {
        isDirectory: true,
        name: "Dossier #B",
        startDate: new Date(2020, 11, 22, 15, 0, 0),
        endDate: new Date(2020, 11, 22, 15, 0, 0),
        size: 948.55
      },
      {
        isDirectory: true,
        name: "Dossier #C",
        startDate: new Date(2020, 11, 22, 15, 0, 0),
        endDate: new Date(2020, 11, 22, 15, 0, 0),
        size: 948.55
      },
      {
        isDirectory: true,
        name: "Dossier #D",
        startDate: new Date(2020, 11, 22, 15, 0, 0),
        endDate: new Date(2020, 11, 22, 15, 0, 0),
        size: 948.55,
        children: [
          {
            isDirectory: true,
            name: "Dossier #1",
            startDate: new Date(2020, 11, 22, 15, 0, 0),
            endDate: new Date(2020, 11, 22, 15, 0, 0),
            size: 948.55
          },
          {
            isDirectory: true,
            name: "Dossier #2",
            startDate: new Date(2020, 11, 22, 15, 0, 0),
            endDate: new Date(2020, 11, 22, 15, 0, 0),
            size: 948.55
          },
          {
            isDirectory: true,
            name: "Dossier #3",
            startDate: new Date(2020, 11, 22, 15, 0, 0),
            endDate: new Date(2020, 11, 22, 15, 0, 0),
            size: 948.55,
            children: [
              {
                isDirectory: true,
                name: "Dossier #a",
                startDate: new Date(2020, 11, 22, 15, 0, 0),
                endDate: new Date(2020, 11, 22, 15, 0, 0),
                size: 948.55
              },
              {
                isDirectory: true,
                name: "Dossier #b",
                startDate: new Date(2020, 11, 22, 15, 0, 0),
                endDate: new Date(2020, 11, 22, 15, 0, 0),
                size: 948.55,
              },
              {
                isDirectory: true,
                name: "Dossier #c",
                startDate: new Date(2020, 11, 22, 15, 0, 0),
                endDate: new Date(2020, 11, 22, 15, 0, 0),
                size: 948.55,
                children: [
                  {
                    isDirectory: false,
                    name: "Fichier #1",
                    startDate: new Date(2020, 11, 22, 15, 0, 0),
                    endDate: new Date(2020, 11, 22, 15, 0, 0),
                    size: 948.55,
                    format: "PDF"
                  },
                  {
                    isDirectory: false,
                    name: "Fichier #2",
                    startDate: new Date(2020, 11, 22, 15, 0, 0),
                    endDate: new Date(2020, 11, 22, 15, 0, 0),
                    size: 948.55,
                    format: "PDF"
                  },
                  {
                    isDirectory: false,
                    name: "Fichier #3",
                    startDate: new Date(2020, 11, 22, 15, 0, 0),
                    endDate: new Date(2020, 11, 22, 15, 0, 0),
                    size: 948.55,
                    format: "PDF"
                  },
                  {
                    isDirectory: false,
                    name: "Fichier #4",
                    startDate: new Date(2020, 11, 22, 15, 0, 0),
                    endDate: new Date(2020, 11, 22, 15, 0, 0),
                    size: 948.55,
                    format: "PDF"
                  },
                  {
                    isDirectory: false,
                    name: "Fichier #5",
                    startDate: new Date(2020, 11, 22, 15, 0, 0),
                    endDate: new Date(2020, 11, 22, 15, 0, 0),
                    size: 948.55,
                    format: "PDF"
                  }
                ]
              }
            ]
          }
        ]
      }
    ];
    const transfer1 = new ArchiveTransfer(
      1111,
      "Versement RH décembre 2020",
      "Versement des fiches de paie et arrêts de travail pour le mois de décembre 2020.",
      new Date(2020, 11, 1, 15, 0, 0),
      new Date(2020, 11, 31, 15, 0, 0),
      transferringAgencies[0],
      creators[0]
    );
    transfer1.lastModificationDate = new Date(2021, 0, 30, 15, 0, 0);
    transfer1.addPackage(1, "Fiches de paie", classification[0].children[3], fileTreeData1);
    transfer1.addPackage(2, "Arrêts de travail", classification[0].children[2], []);
    const archiveTransfers = [
      new ArchiveTransfer(2222, "Versement RH février 2021", null, null, null, transferringAgencies[1]),
      transfer1
    ];
    const comments = [
      {
        date: new Date(2021, 0, 28, 15, 0, 0),
        user: "Patrick",
        text: "J'ai un doute sur le format de ce fichier, convient-il pour le versement ?",
        file: "Fichier #1"
      },
      {
        date: new Date(2021, 1, 5, 15, 0, 0),
        user: "Sophie Bertrand",
        text: "Oui, il convient tout à fait.",
        file: "Fichier #1"
      }
    ]
    return {
      transferringAgencies: transferringAgencies,
      creators: creators,
      classification: classification,
      archiveTransfers: archiveTransfers,
      comments: comments
    };
  }

  // Overrides the genId method to ensure that a hero always has an id.
  // If the heroes array is empty,
  // the method below returns the initial number (11).
  // if the heroes array is not empty, the method below returns the highest
  // hero id + 1.
  genId(archiveTransfers: ArchiveTransfer[]): number {
    return archiveTransfers.length > 0 ? Math.max(...archiveTransfers.map(hero => hero.id)) + 1 : 11;
  }
}
