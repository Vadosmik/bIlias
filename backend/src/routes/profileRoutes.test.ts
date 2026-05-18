import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { ProfileController } from '../controllers/profileController.js';
import { ProfileService } from '../services/profileService.js';

vi.mock('../services/profileService.js');

function createTestApp(controller: ProfileController) {
  const app = express();
  app.use(express.json());
  app.patch('/users/:userId/profile', (req, res) => controller.updateProfile(req, res));
  app.post('/profile/password', (req, res) => controller.changePassword(req, res));
  app.get('/users/:userId/profile/completeness', (req, res) => controller.getProfileCompleteness(req, res));
  return app;
}

describe('ProfileController', () => {
  let mockProfileService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProfileService = {
      getUserRole: vi.fn(),
      updateStudentProfile: vi.fn(),
      updateLecturerProfile: vi.fn(),
      changePassword: vi.fn(),
      getProfileCompleteness: vi.fn(),
    };
  });

  describe('PATCH /users/:userId/profile', () => {
    it('should update student profile successfully', async () => {
      mockProfileService.getUserRole.mockResolvedValue('student');
      mockProfileService.updateStudentProfile.mockResolvedValue(undefined);

      const controller = new ProfileController(mockProfileService);
      const app = createTestApp(controller);

      const response = await request(app)
        .patch('/users/1/profile')
        .send({ wydzial_id: 1, kierunek_id: 2, specjalizacja_id: 3 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 when student update fails', async () => {
      mockProfileService.getUserRole.mockResolvedValue('student');
      mockProfileService.updateStudentProfile.mockRejectedValue(new Error('Blad aktualizacji'));

      const controller = new ProfileController(mockProfileService);
      const app = createTestApp(controller);

      const response = await request(app)
        .patch('/users/1/profile')
        .send({ wydzial_id: 1 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should update lecturer profile with only wydzial', async () => {
      mockProfileService.getUserRole.mockResolvedValue('prowadzacy');
      mockProfileService.updateLecturerProfile.mockResolvedValue(undefined);

      const controller = new ProfileController(mockProfileService);
      const app = createTestApp(controller);

      const response = await request(app)
        .patch('/users/1/profile')
        .send({ wydzial_id: 1 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /profile/password', () => {
    it('should change password successfully', async () => {
      mockProfileService.changePassword.mockResolvedValue(undefined);

      const controller = new ProfileController(mockProfileService);
      const app = createTestApp(controller);

      const response = await request(app)
        .post('/profile/password')
        .send({
          userId: 1,
          oldPassword: 'OldPass123',
          newPassword: 'NewPass123',
          confirmPassword: 'NewPass123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 when passwords do not match', async () => {
      mockProfileService.changePassword.mockRejectedValue(new Error('Nowe hasla nie sa identyczne'));

      const controller = new ProfileController(mockProfileService);
      const app = createTestApp(controller);

      const response = await request(app)
        .post('/profile/password')
        .send({
          userId: 1,
          oldPassword: 'OldPass123',
          newPassword: 'NewPass123',
          confirmPassword: 'DifferentPass123',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 when old password is incorrect', async () => {
      mockProfileService.changePassword.mockRejectedValue(new Error('Bledne aktualne haslo'));

      const controller = new ProfileController(mockProfileService);
      const app = createTestApp(controller);

      const response = await request(app)
        .post('/profile/password')
        .send({
          userId: 1,
          oldPassword: 'WrongPassword',
          newPassword: 'NewPass123',
          confirmPassword: 'NewPass123',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bledne aktualne haslo');
    });

    it('should return 400 when password is too short', async () => {
      mockProfileService.changePassword.mockRejectedValue(new Error('Haslo musi miec co najmniej 8 znakow'));

      const controller = new ProfileController(mockProfileService);
      const app = createTestApp(controller);

      const response = await request(app)
        .post('/profile/password')
        .send({
          userId: 1,
          oldPassword: 'OldPass123',
          newPassword: 'Short1',
          confirmPassword: 'Short1',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Haslo musi miec co najmniej 8 znakow');
    });

    it('should return 400 when password lacks uppercase letter', async () => {
      mockProfileService.changePassword.mockRejectedValue(new Error('Haslo musi zawierac co najmniej jedna wielka litere'));

      const controller = new ProfileController(mockProfileService);
      const app = createTestApp(controller);

      const response = await request(app)
        .post('/profile/password')
        .send({
          userId: 1,
          oldPassword: 'OldPass123',
          newPassword: 'newpassword1',
          confirmPassword: 'newpassword1',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Haslo musi zawierac co najmniej jedna wielka litere');
    });

    it('should return 400 when password lacks digit', async () => {
      mockProfileService.changePassword.mockRejectedValue(new Error('Haslo musi zawierac co najmniej jedna cyfre'));

      const controller = new ProfileController(mockProfileService);
      const app = createTestApp(controller);

      const response = await request(app)
        .post('/profile/password')
        .send({
          userId: 1,
          oldPassword: 'OldPass123',
          newPassword: 'NewPassword',
          confirmPassword: 'NewPassword',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Haslo musi zawierac co najmniej jedna cyfre');
    });

    it('should return 400 when required fields are missing', async () => {
      const controller = new ProfileController(mockProfileService);
      const app = createTestApp(controller);

      const response = await request(app)
        .post('/profile/password')
        .send({ userId: 1, oldPassword: 'OldPass123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Wszystkie pola sa wymagane');
    });
  });

  describe('GET /users/:userId/profile/completeness', () => {
    it('should return profile completeness when complete', async () => {
      mockProfileService.getProfileCompleteness.mockResolvedValue({
        complete: true,
        missing: [],
      });

      const controller = new ProfileController(mockProfileService);
      const app = createTestApp(controller);

      const response = await request(app).get('/users/1/profile/completeness');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.complete).toBe(true);
      expect(response.body.data.missing).toEqual([]);
    });

    it('should return missing fields when profile incomplete', async () => {
      mockProfileService.getProfileCompleteness.mockResolvedValue({
        complete: false,
        missing: ['wydział', 'kierunek'],
      });

      const controller = new ProfileController(mockProfileService);
      const app = createTestApp(controller);

      const response = await request(app).get('/users/1/profile/completeness');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.complete).toBe(false);
      expect(response.body.data.missing).toContain('wydział');
    });

    it('should return 500 on service error', async () => {
      mockProfileService.getProfileCompleteness.mockRejectedValue(new Error('Blad bazy danych'));

      const controller = new ProfileController(mockProfileService);
      const app = createTestApp(controller);

      const response = await request(app).get('/users/1/profile/completeness');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });
});