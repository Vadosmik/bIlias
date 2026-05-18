import { type Request, type Response } from 'express';
import { ProfileService } from '../services/profileService.js';

export class ProfileController {
  constructor(private profileService: ProfileService = new ProfileService()) {}

  public async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = Number(req.params.userId);
      const userRole = await this.profileService.getUserRole(userId);

      if (userRole === 'student') {
        const { wydzial_id, kierunek_id, specjalizacja_id } = req.body;
        await this.profileService.updateStudentProfile(userId, {
          wydzial_id: wydzial_id ? Number(wydzial_id) : undefined,
          kierunek_id: kierunek_id ? Number(kierunek_id) : undefined,
          specjalizacja_id: specjalizacja_id !== undefined
            ? (specjalizacja_id ? Number(specjalizacja_id) : null)
            : undefined,
        });
      } else {
        const { wydzial_id } = req.body;
        await this.profileService.updateLecturerProfile(userId, {
          wydzial_id: Number(wydzial_id),
        });
      }

      res.status(200).json({
        success: true,
        message: 'Profil zaktualizowany pomyslnie',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Blad aktualizacji profilu';
      res.status(400).json({
        success: false,
        error: message,
      });
    }
  }

  public async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const userId = Number(req.body.userId);
      const { oldPassword, newPassword, confirmPassword } = req.body;

      if (!oldPassword || !newPassword || !confirmPassword) {
        res.status(400).json({
          success: false,
          error: 'Wszystkie pola sa wymagane',
        });
        return;
      }

      await this.profileService.changePassword({
        userId,
        oldPassword,
        newPassword,
        confirmPassword,
      });

      res.status(200).json({
        success: true,
        message: 'Haslo zostalo zmienione pomyslnie',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Blad zmiany hasla';
      res.status(400).json({
        success: false,
        error: message,
      });
    }
  }

  public async getProfileCompleteness(req: Request, res: Response): Promise<void> {
    try {
      const userId = Number(req.params.userId);
      const completeness = await this.profileService.getProfileCompleteness(userId);

      res.status(200).json({
        success: true,
        data: completeness,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Blad pobierania danych profilu';
      res.status(500).json({
        success: false,
        error: message,
      });
    }
  }
}