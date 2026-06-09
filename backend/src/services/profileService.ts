import bcrypt from 'bcrypt';
import { userRepository } from '../repositories/userRepository.js';

export interface UpdateStudentProfileInput {
  wydzial_id?: number;
  kierunek_id?: number;
  specjalizacja_id?: number | null;
}

export interface UpdateLecturerProfileInput {
  wydzial_id: number;
}

export interface ChangePasswordInput {
  userId: number;
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ProfileCompleteness {
  complete: boolean;
  missing: string[];
}

export class ProfileService {
  public async getUserRole(userId: number): Promise<string> {
    const roles = await userRepository.getUserRoles(userId);
    return roles[0]?.role || 'student';
  }

  public async updateStudentProfile(
    userId: number,
    input: UpdateStudentProfileInput
  ): Promise<void> {
    const role = await this.getUserRole(userId);
    if (role !== 'student') {
      throw new Error('Ta operacja jest dostepna tylko dla studentow');
    }

    await userRepository.updateStudentProfile(userId, input);
  }

  public async updateLecturerProfile(
    userId: number,
    input: UpdateLecturerProfileInput
  ): Promise<void> {
    const role = await this.getUserRole(userId);
    if (role !== 'prowadzacy' && role !== 'teacher') {
      throw new Error('Ta operacja jest dostepna tylko dla prowadzacych');
    }

    await userRepository.updateLecturerProfile(userId, input);
  }

  public async changePassword(input: ChangePasswordInput): Promise<void> {
    if (input.newPassword !== input.confirmPassword) {
      throw new Error('Nowe hasla nie sa identyczne');
    }

    if (input.newPassword.length < 8) {
      throw new Error('Haslo musi miec co najmniej 8 znakow');
    }

    if (!/[A-Z]/.test(input.newPassword)) {
      throw new Error('Haslo musi zawierac co najmniej jedna wielka litere');
    }

    if (!/[0-9]/.test(input.newPassword)) {
      throw new Error('Haslo musi zawierac co najmniej jedna cyfre');
    }

    const user = await userRepository.findById(input.userId);
    if (!user) {
      throw new Error('Uzytkownik nie znaleziony');
    }

    const isOldPasswordValid = await userRepository.verifyPassword(user, input.oldPassword);
    if (!isOldPasswordValid) {
      throw new Error('Bledne aktualne haslo');
    }

    const newHash = await bcrypt.hash(input.newPassword, 10);
    await userRepository.updatePassword(input.userId, newHash);
  }

  public async getProfileCompleteness(userId: number): Promise<ProfileCompleteness> {
    return userRepository.getProfileCompleteness(userId);
  }
}