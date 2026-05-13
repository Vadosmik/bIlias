import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import { submissionRepository } from '../repositories/submissionRepository.js';

export class SubmissionService {
  public async submitTask(params: {
    studentId: number;
    zadanieId: number;
    files: Express.Multer.File[];
  }) {
    let submission = await submissionRepository.findByStudentAndTask(params.studentId, params.zadanieId);
    let version = 1;

    if (!submission) {
      submission = await submissionRepository.createSubmission(params.studentId, params.zadanieId);
    } else {
      const oldVersion = submission.current_version;
      version = await submissionRepository.incrementVersion(submission.id);
      // Copy files from previous version to the new one (Cumulative submission)
      await submissionRepository.copyFilesToNewVersion(submission.id, oldVersion, version);
    }

    for (const file of params.files) {
      await submissionRepository.addFileToVersion(submission.id, file.path, file.originalname, version);
    }

    return {
      submissionId: submission.id,
      version
    };
  }

  public async deleteFile(fileId: number) {
    const file = await submissionRepository.findFileVersionById(fileId);
    if (!file) throw new Error('Plik nie istnieje');

    // Delete record
    await submissionRepository.deleteFileVersion(fileId);

    // Optional: Delete physical file if no other record uses it
    // For now we keep it to be safe (could be used in older versions)
    
    return true;
  }

  public async generateSubmissionZip(submissionId: number): Promise<Buffer> {
    const zip = new AdmZip();

    // Try to find real files in DB
    const files = await submissionRepository.findFilesBySubmissionId(submissionId);

    if (files.length > 0) {
      for (const file of files) {
        if (fs.existsSync(file.path)) {
          zip.addLocalFile(file.path, undefined, file.name);
        }
      }
    } else {
      // Mock fallback for demonstration (since we use mock IDs 1, 2, 3 in frontend for now)
      // This allows the teacher to see that the ZIP download works
      zip.addFile("readme.txt", Buffer.from("To jest przykładowy plik z nadesłanego zadania (Mock).", "utf8"));
      zip.addFile("rozwiazanie.txt", Buffer.from("Treść rozwiązania studenta...", "utf8"));
    }

    return zip.toBuffer();
  }
}
