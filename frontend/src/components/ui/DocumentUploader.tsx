'use client';

import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { UploadCloud, File, Trash2, Loader2, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface DocumentUploaderProps {
  entityType: string;
  entityId: number;
}

interface Doc {
  id: number;
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  createdAt: string;
}

export function DocumentUploader({ entityType, entityId }: DocumentUploaderProps) {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const queryKey = ['documents', entityType, entityId];

  const { data: documents = [], isLoading } = useQuery<Doc[]>({
    queryKey,
    queryFn: () => api.get(`/documents?entityType=${entityType}&entityId=${entityId}`).then(r => r.data),
  });

  const uploadMut = useMutation({
    mutationFn: async (file: globalThis.File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post(`/documents/upload?entityType=${entityType}&entityId=${entityId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      toast.success('Documento subido correctamente');
    },
    onError: () => toast.error('Error al subir el documento'),
    onSettled: () => setUploading(false),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/documents/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      toast.success('Documento eliminado');
    },
    onError: () => toast.error('Error al eliminar'),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploading(true);
      uploadMut.mutate(e.target.files[0]);
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const downloadUrl = (filename: string) => `/api/documents/${filename}`;

  return (
    <div className="space-y-4">
      {/* Zona de upload */}
      <div 
        onClick={() => !uploading && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer
          ${uploading ? 'bg-gray-50 border-gray-200' : 'border-pureza-blue/30 hover:border-pureza-blue hover:bg-pureza-blue/5'}`}
      >
        <input type="file" ref={inputRef} className="hidden" onChange={handleFileChange} />
        {uploading ? (
          <div className="flex flex-col items-center text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin text-pureza-blue mb-2" />
            <p className="text-sm font-medium">Subiendo archivo...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-gray-500">
            <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3">
              <UploadCloud className="w-6 h-6 text-pureza-blue" />
            </div>
            <p className="text-sm font-medium text-gray-900">Haz clic o arrastra un documento aquí</p>
            <p className="text-xs text-gray-400 mt-1">PDF, Excel, Word o Imágenes (máx. 20MB)</p>
          </div>
        )}
      </div>

      {/* Lista de documentos */}
      {isLoading ? (
        <div className="text-center text-sm text-gray-400 py-4">Cargando documentos...</div>
      ) : documents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {documents.map(doc => (
            <div key={doc.id} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-gray-200 transition-all group">
              <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                <File className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate" title={doc.originalName}>
                  {doc.originalName}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                  <span>{formatSize(doc.size)}</span>
                  <span>•</span>
                  <span>{formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true, locale: es })}</span>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <a href={downloadUrl(doc.filename)} target="_blank" rel="noreferrer"
                  className="p-1.5 text-gray-400 hover:text-pureza-blue hover:bg-blue-50 rounded-md transition-colors" title="Descargar">
                  <Download className="w-4 h-4" />
                </a>
                <button onClick={() => deleteMut.mutate(doc.id)} disabled={deleteMut.isPending}
                  className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors" title="Eliminar">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 text-center py-4">No hay documentos adjuntos a este cliente.</p>
      )}
    </div>
  );
}
