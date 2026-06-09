import type { Request, Response } from 'express';
import { timetableService } from '../services/timetableService.js';
import type { TimetableSearchParams, CreateTimetableInput, UpdateTimetableInput } from '../model/timetableModel.js';

export class TimetableController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const params: TimetableSearchParams = {
        wydzialId: req.query.wydzialId ? Number(req.query.wydzialId) : undefined,
        kierunekId: req.query.kierunekId ? Number(req.query.kierunekId) : undefined,
        specjalizacjaId: req.query.specjalizacjaId ? Number(req.query.specjalizacjaId) : undefined,
        prowadzacyId: req.query.prowadzacyId ? Number(req.query.prowadzacyId) : undefined,
        salaId: req.query.salaId ? Number(req.query.salaId) : undefined,
        tydzien: req.query.tydzien ? Number(req.query.tydzien) : undefined,
        rok: req.query.rok ? Number(req.query.rok) : undefined,
      };
      const timetables = await timetableService.getAllTimetables(params);
      res.status(200).json({ success: true, data: timetables });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Błąd pobierania planu zajęć',
      });
    }
  }

  async getGridData(req: Request, res: Response): Promise<void> {
    try {
      const grid = await timetableService.getGridData();
      res.status(200).json({ success: true, data: grid });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Błąd pobierania danych siatki',
      });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ success: false, error: 'Nieprawidłowe ID' });
        return;
      }
      const timetable = await timetableService.getTimetableById(id);
      res.status(200).json({ success: true, data: timetable });
    } catch (error) {
      const status = error instanceof Error && error.message.includes('nie został') ? 404 : 500;
      res.status(status).json({
        success: false,
        error: error instanceof Error ? error.message : 'Błąd pobierania wpisu',
      });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateTimetableInput = {
        kursId: req.body.kursId,
        dzienId: req.body.dzienId,
        godzinaOd: req.body.godzinaOd,
        godzinaDo: req.body.godzinaDo,
        salaId: req.body.salaId,
        prowadzacyId: req.body.prowadzacyId,
        wydzialId: req.body.wydzialId,
        kierunekId: req.body.kierunekId,
        specjalizacjaId: req.body.specjalizacjaId,
        grupaOznaczenie: req.body.grupaOznaczenie,
        typZajec: req.body.typZajec,
      };
      const entry = await timetableService.createTimetable(data);
      res.status(201).json({ success: true, data: entry });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Błąd tworzenia wpisu planu zajęć',
      });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ success: false, error: 'Nieprawidłowe ID' });
        return;
      }
      const data: UpdateTimetableInput = {
        kursId: req.body.kursId,
        dzienId: req.body.dzienId,
        godzinaOd: req.body.godzinaOd,
        godzinaDo: req.body.godzinaDo,
        salaId: req.body.salaId,
        prowadzacyId: req.body.prowadzacyId,
        grupaOznaczenie: req.body.grupaOznaczenie,
        typZajec: req.body.typZajec,
      };
      const entry = await timetableService.updateTimetable(id, data);
      res.status(200).json({ success: true, data: entry });
    } catch (error) {
      const status = error instanceof Error && error.message.includes('nie został') ? 404 : 500;
      res.status(status).json({
        success: false,
        error: error instanceof Error ? error.message : 'Błąd aktualizacji wpisu planu zajęć',
      });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ success: false, error: 'Nieprawidłowe ID' });
        return;
      }
      await timetableService.deleteTimetable(id);
      res.status(200).json({ success: true, message: 'WPis planu zajęć został usunięty' });
    } catch (error) {
      const status = error instanceof Error && error.message.includes('nie został') ? 404 : 500;
      res.status(status).json({
        success: false,
        error: error instanceof Error ? error.message : 'Błąd usuwania wpisu planu zajęć',
      });
    }
  }

  async search(req: Request, res: Response): Promise<void> {
    try {
      const q = req.query.q as string;
      const typ = (req.query.typ as 'student' | 'prowadzacy' | 'sala') || 'student';
      if (!q) {
        res.status(400).json({ success: false, error: 'Parametr wyszukiwania jest wymagany' });
        return;
      }
      const results = await timetableService.searchTimetable(q, typ);
      res.status(200).json({ success: true, data: results });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Błąd wyszukiwania planu zajęć',
      });
    }
  }
}

export const timetableController = new TimetableController();