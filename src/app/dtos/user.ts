export type UserRole = 'ARCHIVE' | 'TRANSFER';

export interface User {
  id: number;
  name: string;
  role: UserRole;
}
