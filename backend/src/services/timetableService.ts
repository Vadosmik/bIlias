import { timetableRepository } from '../repositories/timetableRepository.js';
import type {
  TimetableEntry,
  TimetableEntryWithDetails,
  TimetableGrid,
  TimetableSearchParams,
  CreateTimetableInput,
  UpdateTimetableInput,
} from '../model/timetableModel.js';

export class TimetableService {
  async getAllTimetables(params: TimetableSearchParams): Promise<TimetableEntryWithDetails[]> {
    try {
      return await timetableRepository.findAll(params);
    } catch (error) {
      console.error('Failed to fetch timetables:', error);
      throw new Error('Nie udało się pobrać planu zajęć');
    }
  }

  async getTimetableById(id: number): Promise<TimetableEntryWithDetails | null> {
    try {
      const entry = await timetableRepository.findById(id);
      if (!entry) {
        throw new Error('WPis planu zajęć nie został znaleziony');
      }
      return entry;
    } catch (error) {
      if (error instanceof Error && error.message.includes('nie został')) {
        throw error;
      }
      console.error('Failed to fetch timetable by id:', error);
      throw new Error('Nie udało się pobrać wpisu planu zajęć');
    }
  }

  async createTimetable(data: CreateTimetableInput): Promise<TimetableEntry> {
    try {
      return await timetableRepository.create(data);
    } catch (error: unknown) {
      const pgError = error as { code?: string; constraint?: string };
      if (pgError.code === '23P01') {
        if (pgError.constraint === 'brak_kolizji_sali') {
          throw new Error('Sala jest już zajęta w tym terminie');
        }
        if (pgError.constraint === 'brak_kolizji_prowadzacego') {
          throw new Error('Wykładowca ma już zajęcia w tym terminie');
        }
      }
      console.error('Failed to create timetable entry:', error);
      throw new Error('Nie udało się utworzyć wpisu planu zajęć');
    }
  }

  async updateTimetable(id: number, data: UpdateTimetableInput): Promise<TimetableEntry | null> {
    try {
      const existing = await timetableRepository.findById(id);
      if (!existing) {
        throw new Error('WPis planu zajęć nie został znaleziony');
      }
      return await timetableRepository.update(id, data);
    } catch (error: unknown) {
      const pgError = error as { code?: string; constraint?: string };
      if (pgError.code === '23P01') {
        if (pgError.constraint === 'brak_kolizji_sali') {
          throw new Error('Sala jest już zajęta w tym terminie');
        }
        if (pgError.constraint === 'brak_kolizji_prowadzacego') {
          throw new Error('Wykładowca ma już zajęcia w tym terminie');
        }
      }
      if (error instanceof Error && error.message.includes('nie został')) {
        throw error;
      }
      console.error('Failed to update timetable entry:', error);
      throw new Error('Nie udało się zaktualizować wpisu planu zajęć');
    }
  }

  async deleteTimetable(id: number): Promise<void> {
    try {
      const deleted = await timetableRepository.delete(id);
      if (!deleted) {
        throw new Error('WPis planu zajęć nie został znaleziony');
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('nie został')) {
        throw error;
      }
      console.error('Failed to delete timetable entry:', error);
      throw new Error('Nie udało się usunąć wpisu planu zajęć');
    }
  }

  async getGridData(): Promise<TimetableGrid> {
    try {
      return await timetableRepository.getGridData();
    } catch (error) {
      console.error('Failed to fetch grid data:', error);
      throw new Error('Nie udało się pobrać danych siatki');
    }
  }

  async searchTimetable(q: string, typ: 'student' | 'prowadzacy' | 'sala'): Promise<TimetableEntryWithDetails[]> {
    try {
      return await timetableRepository.search(q, typ);
    } catch (error) {
      console.error('Failed to search timetables:', error);
      throw new Error('Nie udało się wyszukać planu zajęć');
    }
  }
}

export const timetableService = new TimetableService();