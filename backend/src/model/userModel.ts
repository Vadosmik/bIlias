import { mockUsers } from '../data/mockUser.js';
export interface User {
  id: string;
  email: string;
  password: string;
}

export const findUserByEmail = (email: string): User | undefined =>
  mockUsers.find((user) => user.email.toLowerCase() === email.toLowerCase());
