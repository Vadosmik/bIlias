import { materialRepository, zadanieRepository, folderRepository } from '../repositories/materialRepository.js';
import type { MaterialItem, Folder } from '../model/materialModel.js';
import fs from 'fs';

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
    const [folders, materials, zadania] = await Promise.all([
      folderRepository.findByKursId(kursId),
      materialRepository.findByKursId(kursId),
      zadanieRepository.findByKursId(kursId),
    ]);

    const itemMap = new Map<number | null, MaterialItem[]>();
    
    // Initialize root and folders
    itemMap.set(null, []); // Root items
    for (const folder of folders) {
      itemMap.set(folder.id, []);
    }

    // Add folders to their parents
    const folderMap = new Map<number, MaterialItem>();
    for (const folder of folders) {
      const item: MaterialItem = {
        id: `f-${folder.id}`,
        dbId: folder.id,
        type: 'folder',
        name: folder.nazwa,
        children: itemMap.get(folder.id)
      };
      folderMap.set(folder.id, item);
    }

    const rootItems: MaterialItem[] = itemMap.get(null)!;

    for (const folder of folders) {
      const item = folderMap.get(folder.id)!;
      if (folder.parent_id && folderMap.has(folder.parent_id)) {
        folderMap.get(folder.parent_id)!.children!.push(item);
      } else {
        rootItems.push(item);
      }
    }

    // Add materials
    for (const mat of materials) {
      const format = getFileFormat(mat.mime_type) || 'file';

      const item: MaterialItem = {
        id: `m-${mat.id}`,
        dbId: mat.id,
        type: 'file',
        name: mat.tytul,
        format: format,
        size: formatSize(mat.rozmiar),
      };

      if (mat.folder_id && itemMap.has(mat.folder_id)) {
        itemMap.get(mat.folder_id)!.push(item);
      } else {
        rootItems.push(item);
      }
    }

    // Add zadania
    for (const zad of zadania) {
      const item: MaterialItem = {
        id: `t-${zad.id}`,
        dbId: zad.id,
        type: 'task', // Ten typ musi byc 'task' zeby frontend go zliczyl
        name: zad.tytul,
        deadline: formatDate(zad.termin_oddania),
        description: zad.opis || undefined,
      };

      if (zad.folder_id && itemMap.has(zad.folder_id)) {
        itemMap.get(zad.folder_id)!.push(item);
      } else {
        rootItems.push(item);
      }
    }

    return rootItems;
  }

  public async uploadMaterial(params: {
    kursId: number;
    title: string;
    folderId?: number | null;
    file: Express.Multer.File;
  }) {
    const typPlikuId = 1;

    return await materialRepository.createMaterial({
      kursId: params.kursId,
      tytul: params.title,
      sciezkaPliku: params.file.path,
      typPlikuId: typPlikuId,
      rozmiar: params.file.size,
      mimeType: params.file.mimetype,
      folderId: params.folderId
    });
  }

  public async createTask(params: {
    kursId: number;
    title: string;
    description: string;
    deadline: string;
    folderId?: number | null;
  }) {
    return await zadanieRepository.createTask({
      kursId: params.kursId,
      tytul: params.title,
      opis: params.description,
      terminOddania: params.deadline,
      folderId: params.folderId
    });
  }

  public async createFolder(params: {
    kursId: number;
    nazwa: string;
    parentId?: number | null;
  }) {
    return await folderRepository.create({
      kurs_id: params.kursId,
      nazwa: params.nazwa,
      parent_id: params.parentId
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
      originalName: material.tytul,
      mimeType: material.mime_type
    };
  }

  public async updateMaterial(id: number, data: { name?: string, folderId?: number | null }) {
    return await materialRepository.updateMaterial(id, { 
      tytul: data.name, 
      folder_id: data.folderId 
    });
  }

  public async deleteMaterial(id: number) {
    return await materialRepository.deleteMaterial(id);
  }

  public async updateTask(id: number, data: { title?: string, description?: string, deadline?: string, folderId?: number | null }) {
    return await zadanieRepository.updateTask(id, {
      tytul: data.title,
      opis: data.description,
      terminOddania: data.deadline,
      folder_id: data.folderId
    });
  }

  public async deleteTask(id: number) {
    return await zadanieRepository.deleteTask(id);
  }

  public async renameFolder(id: number, newName: string) {
    return await folderRepository.update(id, { nazwa: newName });
  }

  public async deleteFolder(id: number) {
    return await folderRepository.delete(id);
  }
}
