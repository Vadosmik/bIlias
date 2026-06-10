import { Router } from 'express';
import { dictionaryController } from '../controllers/dictionaryController.js';

const dictionaryRoutes = Router();

dictionaryRoutes.get('/departments', (req, res) => dictionaryController.getDepartments(req, res));
dictionaryRoutes.get('/departments/:departmentId/courses', (req, res) => dictionaryController.getCourses(req, res));
dictionaryRoutes.get('/courses/:courseId/specializations', (req, res) => dictionaryController.getSpecializations(req, res));
dictionaryRoutes.get('/rooms', (req, res) => dictionaryController.getRooms(req, res));
dictionaryRoutes.get('/instructors', (req, res) => dictionaryController.getInstructors(req, res));

export { dictionaryRoutes };
