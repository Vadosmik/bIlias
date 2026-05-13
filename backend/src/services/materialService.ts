import { materialRepository, zadanieRepository } from '../repositories/materialRepository.js';
import type { MaterialItem } from '../model/materialModel.js';
import fs from 'fs';
import path from 'path';

const FORMAT_MAP: Record<string, string> = {
  'pdf': 'pdf',
  'sql': 'sql',
  'sh': 'sh',
  'doc': 'doc',
  'docx': 'docx',
  'ppt': 'ppt',
  'pptx': 'pptx',
  'zip': 'zip',
  'rar': 'rar',
  'mp4': 'mp4',
  'avi': 'avi',
};

function formatSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 16);
}

function getFileFormat(mimeType: string | null): string | undefined {
  if (!mimeType) return undefined;
  const ext = mimeType.split('/')[1]?.toLowerCase() || '';
  return FORMAT_MAP[ext] || ext;
}

export class MaterialService {
  public async getMaterialsForCourse(kursId: number): Promise<MaterialItem[]> {
    const [materials, zadania] = await Promise.all([
      materialRepository.findByKursId(kursId),
      zadanieRepository.findByKursId(kursId),
    ]);

    const items: MaterialItem[] = [];

    // Group materials by their path/title prefix to create folders
    const materialMap = new Map<string, MaterialItem>();
    const rootItems: MaterialItem[] = [];

    for (const mat of materials) {
      const typPliku = await materialRepository.findTypPlikuById(mat.typ_pliku_id || 0);
      const format = getFileFormat(mat.mime_type) || typPliku?.nazwa.toLowerCase() || 'file';

      const item: MaterialItem = {
        id: `m-${mat.id}`,
        type: 'file',
        name: mat.tytul,
        format: format,
        size: formatSize(mat.rozmiar),
      };

      materialMap.set(`m-${mat.id}`, item);

      // Check if title looks like it belongs in a folder (e.g., "Laboratorium 1 - Wprowadzenie")
      const folderMatch = mat.tytul.match(/^(.+?)\s*-\s*(.+)$/);
      if (folderMatch) {
        const [, folderName, fileName] = folderMatch;
        let folder = rootItems.find(f => f.name === folderName);

        if (!folder) {
          folder = {
            id: `folder-${folderName.replace(/\s+/g, '-')}`,
            type: 'folder',
            name: folderName,
            children: [],
          };
          rootItems.push(folder);
        }

        folder.children = folder.children || [];
        folder.children.push({ ...item, name: fileName });
      } else {
        rootItems.push(item);
      }
    }

    // Add zadania as tasks
    for (const zad of zadania) {
      const item: MaterialItem = {
        id: `t-${zad.id}`,
        type: 'task',
        name: zad.tytul,
        deadline: formatDate(zad.termin_oddania),
        description: zad.opis || undefined,
      };

      const folderMatch = zad.tytul.match(/^(.+?)\s*-\s*(.+)$/);
      if (folderMatch) {
        const [, folderName, taskName] = folderMatch;
        let folder = rootItems.find(f => f.name === folderName);

        if (!folder) {
          folder = {
            id: `folder-${folderName.replace(/\s+/g, '-')}`,
            type: 'folder',
            name: folderName,
            children: [],
          };
          rootItems.push(folder);
        }

        folder.children = folder.children || [];
        folder.children.push({ ...item, name: taskName });
      } else {
        rootItems.push(item);
      }
    }

    return rootItems;
  }

  public async uploadMaterial(params: {
    kursId: number;
    title: string;
    folderName?: string;
    file: Express.Multer.File;
  }) {
    const finalTitle = params.folderName 
      ? `${params.folderName} - ${params.title}` 
      : params.title;

    const typPlikuId = 1;

    return await materialRepository.createMaterial({
      kursId: params.kursId,
      tytul: finalTitle,
      sciezkaPliku: params.file.path,
      typPlikuId: typPlikuId,
      rozmiar: params.file.size,
      mimeType: params.file.mimetype
    });
  }

  public async createTask(params: {
    kursId: number;
    title: string;
    description: string;
    deadline: string;
  }) {
    return await zadanieRepository.createTask({
      kursId: params.kursId,
      tytul: params.title,
      opis: params.description,
      terminOddania: params.deadline
    });
  }

  public async getMaterialForDownload(materialId: number) {
    const material = await materialRepository.findByMaterialId(materialId);
    
    if (!material) {
      throw new Error('Materiał nie istnieje');
    }

    if (!fs.existsSync(material.sciezka_pliku)) {
      throw new Error('Plik nie został znaleziony na serwerze');
    }

    return {
      path: material.sciezka_pliku,
      originalName: material.tytul.split(' - ').pop() || material.tytul,
      mimeType: material.mime_type
    };
  }

  public async updateMaterial(id: number, data: { name?: string, folderName?: string }) {
    const material = await materialRepository.findByMaterialId(id);
    if (!material) throw new Error('Materiał nie istnieje');

    const match = material.tytul.match(/^(.+?)\s*-\s*(.+)$/);
    const currentFolder = match ? match[1] : '';
    const currentName = match ? match[2] : material.tytul;

    const finalName = data.name !== undefined ? data.name : currentName;
    const finalFolder = data.folderName !== undefined ? data.folderName : currentFolder;

    const newTitle = finalFolder ? `${finalFolder} - ${finalName}` : finalName;

    return await materialRepository.updateMaterial(id, { tytul: newTitle });
  }

  public async deleteMaterial(id: number) {
    return await materialRepository.deleteMaterial(id);
  }

  public async updateTask(id: number, data: { title?: string, description?: string, deadline?: string, folderName?: string }) {
    const task = await zadanieRepository.findById(id);
    if (!task) throw new Error('Zadanie nie istnieje');

    const match = task.tytul.match(/^(.+?)\s*-\s*(.+)$/);
    const currentFolder = match ? match[1] : '';
    const currentTitle = match ? match[2] : task.tytul;

    const finalTitle = data.title !== undefined ? data.title : currentTitle;
    const finalFolder = data.folderName !== undefined ? data.folderName : currentFolder;

    const newTitle = finalFolder ? `${finalFolder} - ${finalTitle}` : finalTitle;

    return await zadanieRepository.updateTask(id, {
      tytul: newTitle,
      opis: data.description,
      terminOddania: data.deadline
    });
  }

  public async deleteTask(id: number) {
    return await zadanieRepository.deleteTask(id);
  }

  public async renameFolder(kursId: number, oldName: string, newName: string) {
    // Update materials
    const materials = await materialRepository.findByKursIdAndFolderPrefix(kursId, oldName);
    for (const mat of materials) {
      const match = mat.tytul.match(/^(.+?)\s*-\s*(.+)$/);
      if (match && match[1] === oldName) {
        const fileName = match[2];
        const newTitle = `${newName} - ${fileName}`;
        await materialRepository.updateMaterial(mat.id, { tytul: newTitle });
      }
    }

    // Update tasks
    const tasks = await zadanieRepository.findByKursId(kursId);
    for (const task of tasks) {
      const match = task.tytul.match(/^(.+?)\s*-\s*(.+)$/);
      if (match && match[1] === oldName) {
        const taskName = match[2];
        const newTitle = `${newName} - ${taskName}`;
        await zadanieRepository.updateTask(task.id, { tytul: newTitle });
      }
    }
  }

  public async deleteFolder(kursId: number, folderName: string) {
    console.log(`Deleting folder "${folderName}" in course ${kursId}`);
    
    await Promise.all([
      materialRepository.deleteByFolderPrefix(kursId, folderName),
      zadanieRepository.deleteByFolderPrefix(kursId, folderName)
    ]);

    console.log(`Folder "${folderName}" deleted successfully`);
  }
}