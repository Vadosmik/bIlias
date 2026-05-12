'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  Folder, 
  FileText, 
  MoreVertical, 
  Plus, 
  Upload, 
  FolderPlus, 
  FileCode, 
  FileArchive,
  ChevronRight,
  Download,
  Pencil,
  Trash2,
  Move,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';

// Mock materials and folders
const initialMaterials = [
  { id: 'f1', type: 'folder', name: 'Laboratorium 1 - Wprowadzenie', children: [
    { id: 'm1', type: 'file', name: 'Instrukcja_Lab1.pdf', format: 'pdf', size: '1.2 MB' },
    { id: 'm2', type: 'file', name: 'schemat_bazy.sql', format: 'sql', size: '15 KB' },
    { id: 'm3', type: 'file', name: 'setup.sh', format: 'sh', size: '2 KB' },
  ]},
  { id: 'f2', type: 'folder', name: 'Wykłady', children: [
    { id: 'm4', type: 'file', name: 'Wyklad_1_Architektura.pdf', format: 'pdf', size: '5.4 MB' },
    { id: 'm5', type: 'file', name: 'Wyklad_2_Normalizacja.pdf', format: 'pdf', size: '4.1 MB' },
  ]},
  { id: 'm6', type: 'file', name: 'Sylabus_Przedmiotu.pdf', format: 'pdf', size: '0.8 MB' },
  { id: 't1', type: 'task', name: 'Zadanie Domowe 1 - Projekt E-R', deadline: '2024-05-20', description: 'Należy przygotować diagram encji dla systemu bibliotecznego uwzględniając wypożyczenia i rezerwacje.' },
];

export default function CourseDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [openFolders, setOpenFolders] = useState<string[]>(['f1']);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const isLecturer = user?.role === 'teacher';

  const toggleFolder = (folderId: string) => {
    setOpenFolders(prev => 
      prev.includes(folderId) 
        ? prev.filter(id => id !== folderId) 
        : [...prev, folderId]
    );
  };

  const renderIcon = (item: any) => {
    if (item.type === 'folder') return <Folder className="w-5 h-5 text-brand-sand fill-brand-sand/20" />;
    if (item.type === 'task') return <FileArchive className="w-5 h-5 text-orange-500" />;
    
    switch (item.format) {
      case 'pdf': return <FileText className="w-5 h-5 text-red-500" />;
      case 'sql':
      case 'sh': return <FileCode className="w-5 h-5 text-blue-500" />;
      default: return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Course Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-sand bg-brand-sand/10 px-2 py-0.5 rounded">BD-2024</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/50 italic">Semestr 6</span>
          </div>
          <h1 className="text-3xl font-bold text-brand-navy">Bazy Danych</h1>
          <p className="text-muted-foreground mt-1">Prowadzący: Dr inż. Tomasz Papierowski</p>
        </div>

        {isLecturer && (
          <div className="flex gap-2">
            <button className="flex items-center gap-2 bg-white border border-brand-gray/20 text-brand-navy px-4 py-2 rounded-xl text-sm font-bold hover:bg-brand-light transition-all shadow-sm">
              <FolderPlus className="w-4 h-4" />
              Nowy Folder
            </button>
            <button 
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2 bg-brand-navy text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-brand-navy/90 transition-all shadow-brand-sm"
            >
              <Plus className="w-4 h-4" />
              Dodaj Materiał
            </button>
          </div>
        )}
      </section>

      {/* Materials List */}
      <div className="bg-white rounded-2xl border border-brand-gray/10 shadow-brand-sm overflow-hidden">
        <div className="p-4 border-b border-brand-gray/5 bg-brand-light/30 flex justify-between items-center">
          <h2 className="text-sm font-bold text-brand-navy uppercase tracking-wider">Materiały i Zadania</h2>
          <span className="text-xs text-muted-foreground">{initialMaterials.length} elementów</span>
        </div>

        <div className="divide-y divide-brand-gray/5">
          {initialMaterials.map((item) => (
            <div key={item.id} className="flex flex-col">
              {/* Main Item Row */}
              <div 
                className={cn(
                  "flex items-center justify-between px-6 py-4 hover:bg-brand-light/30 transition-colors group cursor-pointer",
                  item.type === 'folder' && "bg-white"
                )}
                onClick={() => {
                  if (item.type === 'folder') toggleFolder(item.id);
                  if (item.type === 'task') setSelectedTask(item);
                }}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-light">
                    {renderIcon(item)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-brand-navy truncate group-hover:text-brand-sand transition-colors">
                      {item.name}
                    </p>
                    {item.type === 'file' && (
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                        {item.format} • {item.size}
                      </p>
                    )}
                    {item.type === 'task' && (
                      <p className="text-[10px] text-orange-600 font-bold tracking-tighter uppercase flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Termin: {item.deadline}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.type === 'file' && (
                    <button className="p-2 text-muted-foreground hover:text-brand-navy transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                  {isLecturer && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingItem(item);
                      }}
                      className="p-2 text-muted-foreground hover:text-brand-navy transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Folder Children */}
              {item.type === 'folder' && openFolders.includes(item.id) && (
                <div className="bg-brand-light/10 pl-14 divide-y divide-brand-gray/5 border-l-2 border-brand-sand/20 ml-10 mb-2">
                  {item.children?.map((child) => (
                    <div key={child.id} className="flex items-center justify-between px-6 py-3 hover:bg-white transition-colors group cursor-pointer">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {renderIcon(child)}
                        <div>
                          <p className="text-sm font-semibold text-brand-navy truncate group-hover:text-brand-sand transition-colors">
                            {child.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                            {child.format} • {child.size}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-muted-foreground hover:text-brand-navy transition-colors">
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        {isLecturer && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingItem(child);
                            }}
                            className="p-1.5 text-muted-foreground hover:text-brand-navy transition-colors"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Task Assignment Modal */}
      <Modal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        title="Nadsyłanie Zadania"
        footer={
          <>
            <button 
              onClick={() => setSelectedTask(null)}
              className="px-6 py-2.5 text-sm font-bold text-muted-foreground hover:text-brand-navy transition-colors"
            >
              Anuluj
            </button>
            <button className="bg-brand-navy text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-brand-sm">
              Wyślij Rozwiązanie
            </button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 flex gap-4">
            <div className="bg-orange-100 p-2 rounded-lg text-orange-600 h-fit">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-brand-navy">{selectedTask?.name}</p>
              <p className="text-sm text-muted-foreground mt-1">{selectedTask?.description}</p>
              <div className="mt-3 flex items-center gap-2 text-xs font-bold text-orange-700 uppercase">
                Termin: {selectedTask?.deadline}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-bold text-brand-navy uppercase tracking-wider">Polecenie</label>
            <button className="flex items-center gap-3 w-full p-4 border border-brand-gray/20 rounded-2xl hover:bg-brand-light transition-colors group">
              <FileText className="w-8 h-8 text-red-500" />
              <div className="text-left">
                <p className="text-sm font-bold text-brand-navy">Instrukcja_Zadanie1.pdf</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">1.5 MB • PDF</p>
              </div>
              <Download className="w-5 h-5 ml-auto text-muted-foreground group-hover:text-brand-navy transition-colors" />
            </button>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-bold text-brand-navy uppercase tracking-wider">Twoje Rozwiązanie</label>
            <div className="border-2 border-dashed border-brand-gray/20 rounded-3xl p-8 flex flex-col items-center justify-center gap-3 hover:border-brand-sand hover:bg-brand-sand/5 transition-all cursor-pointer group">
              <div className="w-12 h-12 bg-brand-light rounded-full flex items-center justify-center text-brand-navy group-hover:bg-brand-sand transition-colors">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-brand-navy">Przeciągnij i upuść plik</p>
                <p className="text-xs text-muted-foreground mt-1">Obsługiwane formaty: ZIP, PDF, RAR (max 50MB)</p>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit Material Modal (Lecturer only) */}
      <Modal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title={`Zarządzaj: ${editingItem?.name}`}
        size="sm"
      >
        <div className="grid grid-cols-1 gap-2">
          <button className="flex items-center gap-3 w-full p-4 rounded-2xl hover:bg-brand-light transition-colors text-left group">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100"><Pencil className="w-4 h-4" /></div>
            <span className="font-bold text-brand-navy text-sm">Zmień nazwę</span>
          </button>
          <button className="flex items-center gap-3 w-full p-4 rounded-2xl hover:bg-brand-light transition-colors text-left group">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg group-hover:bg-orange-100"><Move className="w-4 h-4" /></div>
            <span className="font-bold text-brand-navy text-sm">Przenieś do folderu...</span>
          </button>
          <div className="my-2 border-t border-brand-gray/5" />
          <button className="flex items-center gap-3 w-full p-4 rounded-2xl hover:bg-destructive/5 text-destructive transition-colors text-left group">
            <div className="p-2 bg-destructive/10 rounded-lg group-hover:bg-destructive/20"><Trash2 className="w-4 h-4" /></div>
            <span className="font-bold text-sm">Usuń element</span>
          </button>
        </div>
      </Modal>

      {/* Add/Upload Material Modal (Lecturer only) */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Dodaj nowy materiał"
        footer={
          <>
            <button 
              onClick={() => setIsUploadModalOpen(false)}
              className="px-6 py-2.5 text-sm font-bold text-muted-foreground hover:text-brand-navy transition-colors"
            >
              Anuluj
            </button>
            <button className="bg-brand-navy text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-brand-sm">
              Zapisz i udostępnij
            </button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-brand-navy uppercase tracking-wider">Nazwa wyświetlana</label>
            <input 
              type="text" 
              placeholder="np. Laboratorium 1 - Instrukcja" 
              className="w-full p-3 bg-brand-light border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-sand transition-all"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-brand-navy uppercase tracking-wider">Typ elementu</label>
            <div className="flex gap-2">
              <button className="flex-1 p-3 bg-brand-navy text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                <FileText className="w-4 h-4" /> Plik
              </button>
              <button className="flex-1 p-3 bg-brand-light text-brand-navy rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-brand-gray/10">
                <FileArchive className="w-4 h-4" /> Zadanie
              </button>
            </div>
          </div>

          <div className="border-2 border-dashed border-brand-gray/20 rounded-3xl p-10 flex flex-col items-center justify-center gap-3 hover:border-brand-sand transition-all cursor-pointer">
            <Upload className="w-8 h-8 text-brand-navy/30" />
            <p className="text-sm font-bold text-brand-navy">Kliknij, aby wybrać plik</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
