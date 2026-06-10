import { Router, type Request, type Response } from 'express';
import { ProfileController } from '../controllers/profileController.js';
import { ProfileService } from '../services/profileService.js';

export function createProfileRoutes(profileController?: ProfileController) {
  const controller = profileController || new ProfileController(new ProfileService());
  const profileRoutes = Router();

  profileRoutes.patch('/users/:userId/profile', (req: Request, res: Response) => {
    controller.updateProfile(req, res);
  });

  profileRoutes.get('/users/:userId/profile', (req: Request, res: Response) => {
    controller.getFullProfile(req, res);
  });

  profileRoutes.post('/profile/password', (req: Request, res: Response) => {
    controller.changePassword(req, res);
  });

  profileRoutes.get('/users/:userId/profile/completeness', (req: Request, res: Response) => { 
    controller.getProfileCompleteness(req, res);
  });

  return profileRoutes;
}

const { profileRoutes } = { profileRoutes: createProfileRoutes() };
export { profileRoutes };