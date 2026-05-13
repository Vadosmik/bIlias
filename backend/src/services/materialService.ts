import { materialRepository, zadanieRepository } from '../repositories/materialRepository.js';
import type { MaterialItem } from '../model/materialModel.js';

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
  return date.toISOString().split('T')[0];
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
        folder.children.push({ ...item, id: `${item.id}-${mat.id}`, name: fileName });
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
      rootItems.push(item);
    }

    return rootItems;
  }
}