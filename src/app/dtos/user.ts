export type UserRole = 'ARCHIVE' | 'TRANSFER';

export interface User {
  id: number;
  name: string;
  role: UserRole;
}

export class UserUtil {
  static getDisplayRole(role: UserRole): any {
    switch (role) {
      case 'ARCHIVE':
        return 'archiviste';
      case 'TRANSFER':
        return 'agent versant';
      default:
        return '-';
    }
  }
}
