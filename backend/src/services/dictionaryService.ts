import { dictionaryRepository } from '../repositories/dictionaryRepository.js';

export class DictionaryService {
  async getDepartments() {
    return dictionaryRepository.getDepartments();
  }

  async getCourses(departmentId: number) {
    return dictionaryRepository.getCoursesByDepartment(departmentId);
  }

  async getSpecializations(courseId: number) {
    return dictionaryRepository.getSpecializationsByCourse(courseId);
  }

  async getRooms() {
    return dictionaryRepository.getRooms();
  }

  async getInstructors() {
    return dictionaryRepository.getInstructors();
  }
}

export const dictionaryService = new DictionaryService();
