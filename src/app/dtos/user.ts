export type UserRole = 'archive' | 'transfer';

export interface User {
  id: number;
  name: string;
  role: UserRole;
}
