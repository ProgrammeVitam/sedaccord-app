export type MessageType = 'SUBMITTED_ARCHIVE_TRANSFER' | 'UPDATED_ARCHIVE_TRANSFER';

export interface Message {
  id: number;
  archiveTransferId: number;
  creationUserId: number;
  type: MessageType;
}

export class MessageUtil {
  static getDisplayMessages(messages: Message[]): string[] {
    return messages.map(message => message.type)
      .filter((type, i, arr) => arr.indexOf(type) === i) // Filter unique values
      .reduce((acc: string[], currentValue) => {
        switch (currentValue) {
          case 'SUBMITTED_ARCHIVE_TRANSFER':
            acc.push('Une nouvelle demande de versement est arrivée.');
            break;
          case 'UPDATED_ARCHIVE_TRANSFER':
            acc.push('Un versement a été mis à jour.');
            break;
        }
        return acc;
      }, []);
  }
}
