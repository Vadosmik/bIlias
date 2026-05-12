/**
 * Centralized API abstraction layer for bIlias.
 * Currently uses mock data, but structured for future integration with real backend.
 */

export interface Course {
  id: string;
  name: string;
  code: string;
  department: string;
  semester: number;
  lecturers: string[];
  joined: boolean;
  progress?: number;
}

export interface Material {
  id: string;
  type: 'folder' | 'file' | 'task';
  name: string;
  format?: string;
  size?: string;
  deadline?: string;
  description?: string;
  children?: Material[];
}

const mockCourses: Course[] = [
  { id: '1', name: 'Bazy Danych', code: 'BD-2024', department: 'Wydział Elektryczny', semester: 6, lecturers: ['Dr inż. Tomasz Papierowski'], joined: true, progress: 75 },
  { id: '2', name: 'Programowanie Obiektowe', code: 'PO-2024', department: 'Wydział Elektryczny', semester: 6, lecturers: ['Mgr inż. Kacper Szamszon'], joined: true, progress: 40 },
  { id: '3', name: 'Sieci Komputerowe', code: 'SK-2024', department: 'Wydział Elektryczny', semester: 6, lecturers: ['Dr Sofiia Stankevych'], joined: true, progress: 90 },
  { id: '4', name: 'Systemy Operacyjne', code: 'SO-2024', department: 'Wydział Elektryczny', semester: 5, lecturers: ['Dr inż. Vadzim Mikanovich'], joined: false },
  { id: '5', name: 'Matematyka Dyskretna', code: 'MD-2023', department: 'Wydział Elektryczny', semester: 1, lecturers: ['Mgr Monika Szczepańska'], joined: false },
];

export const api = {
  courses: {
    getAll: async (): Promise<Course[]> => {
      return new Promise((resolve) => setTimeout(() => resolve(mockCourses), 500));
    },
    getUserCourses: async (userId: string): Promise<Course[]> => {
      return new Promise((resolve) => 
        setTimeout(() => resolve(mockCourses.filter(c => c.joined)), 500)
      );
    },
    getById: async (id: string): Promise<Course | undefined> => {
      return new Promise((resolve) => 
        setTimeout(() => resolve(mockCourses.find(c => c.id === id)), 300)
      );
    },
    join: async (id: string): Promise<boolean> => {
      console.log(`Joining course ${id}...`);
      return new Promise((resolve) => setTimeout(() => resolve(true), 800));
    }
  },
  materials: {
    getByCourseId: async (courseId: string): Promise<Material[]> => {
      // Logic would be here to fetch from DB
      return new Promise((resolve) => setTimeout(() => resolve([]), 300));
    },
    upload: async (courseId: string, folderId: string | null, data: any): Promise<boolean> => {
      console.log(`Uploading to course ${courseId}...`, data);
      return new Promise((resolve) => setTimeout(() => resolve(true), 1000));
    },
    update: async (id: string, data: any): Promise<boolean> => {
      console.log(`Updating material ${id}...`, data);
      return new Promise((resolve) => setTimeout(() => resolve(true), 500));
    },
    delete: async (id: string): Promise<boolean> => {
      console.log(`Deleting material ${id}...`);
      return new Promise((resolve) => setTimeout(() => resolve(true), 500));
    }
  }
};
