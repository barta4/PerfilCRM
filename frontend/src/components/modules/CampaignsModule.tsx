

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardBody, CardHeader, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { StatCard } from '@/components/ui/StatCard';
import {
  Mail, Plus, Search, Eye, Code, Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, Link as LinkIcon,
  Image as ImageIcon, Eraser, Calendar, User, CheckCircle2, XCircle,
  AlertCircle, ChevronRight, RefreshCw, Filter, ArrowLeft, ExternalLink,
  Trash2, ChevronDown, ChevronUp, Minus, Palette, Type, Sparkles, Copy
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// --- HtmlEditor Component ---
interface HtmlEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export function HtmlEditor({ value, onChange, placeholder }: HtmlEditorProps) {
  const [viewMode, setViewMode] = useState<'visual' | 'code'>('visual');
  const editorRef = useRef<HTMLDivElement>(null);
  const [htmlValue, setHtmlValue] = useState(value);
  const savedRangeRef = useRef<Range | null>(null);

  // Active format state
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    justifyLeft: false,
    justifyCenter: false,
    justifyRight: false,
    justifyFull: false,
    insertUnorderedList: false,
    insertOrderedList: false,
  });

  // Link modal state
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  // Image upload state
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageTab, setImageTab] = useState<'upload' | 'url'>('upload');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize incoming value prop
  useEffect(() => {
    setHtmlValue(value);
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const saveSelection = () => {
    if (typeof window === 'undefined') return;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      try {
        savedRangeRef.current = sel.getRangeAt(0).cloneRange();
      } catch {}
    }
  };

  const restoreSelection = () => {
    if (typeof window === 'undefined') return;
    if (savedRangeRef.current && editorRef.current) {
      editorRef.current.focus();
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedRangeRef.current);
      }
    }
  };

  const updateActiveFormats = useCallback(() => {
    if (typeof document === 'undefined' || viewMode !== 'visual') return;
    saveSelection();
    try {
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikeThrough: document.queryCommandState('strikeThrough'),
        justifyLeft: document.queryCommandState('justifyLeft'),
        justifyCenter: document.queryCommandState('justifyCenter'),
        justifyRight: document.queryCommandState('justifyRight'),
        justifyFull: document.queryCommandState('justifyFull'),
        insertUnorderedList: document.queryCommandState('insertUnorderedList'),
        insertOrderedList: document.queryCommandState('insertOrderedList'),
      });
    } catch {}
  }, [viewMode]);

  const handleVisualChange = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      setHtmlValue(html);
      onChange(html);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setHtmlValue(val);
    onChange(val);
  };

  const handleSwitchMode = (mode: 'visual' | 'code') => {
    if (mode === 'code') {
      const currentHtml = editorRef.current ? editorRef.current.innerHTML : htmlValue;
      setHtmlValue(currentHtml);
      onChange(currentHtml);
    } else {
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = htmlValue;
        }
      }, 0);
      onChange(htmlValue);
    }
    setViewMode(mode);
  };

  const execCmd = (command: string, cmdValue: string = '') => {
    if (viewMode !== 'visual') return;
    editorRef.current?.focus();
    restoreSelection();
    try {
      document.execCommand('styleWithCSS', false, 'true');
    } catch {}
    document.execCommand(command, false, cmdValue);
    handleVisualChange();
    updateActiveFormats();
  };

  const handleFormatBlock = (tag: string) => {
    if (!tag) return;
    execCmd('formatBlock', tag);
  };

  const handleTextColor = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    if (color) {
      execCmd('foreColor', color);
    }
  };

  const insertVariable = (variable: string) => {
    if (viewMode === 'visual') {
      editorRef.current?.focus();
      restoreSelection();
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
        sel.deleteFromDocument();
        const range = sel.getRangeAt(0);
        const textNode = document.createTextNode(variable);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
        savedRangeRef.current = range;
      } else if (editorRef.current) {
        editorRef.current.innerHTML += variable;
      }
      handleVisualChange();
      updateActiveFormats();
    } else {
      const next = htmlValue + variable;
      setHtmlValue(next);
      onChange(next);
    }
  };

  const openLinkModal = () => {
    saveSelection();
    const sel = window.getSelection();
    const selectedText = sel ? sel.toString() : '';
    setLinkText(selectedText);
    setLinkUrl('');
    setIsLinkModalOpen(true);
  };

  const handleApplyLink = () => {
    setIsLinkModalOpen(false);
    if (!linkUrl.trim()) return;

    restoreSelection();
    const url = linkUrl.startsWith('http://') || linkUrl.startsWith('https://') || linkUrl.startsWith('mailto:')
      ? linkUrl.trim()
      : `https://${linkUrl.trim()}`;

    if (linkText.trim() && (!savedRangeRef.current || savedRangeRef.current.collapsed)) {
      const linkHtml = `<a href="${url}" target="_blank" rel="noopener noreferrer">${linkText.trim()}</a>`;
      execCmd('insertHTML', linkHtml);
    } else {
      execCmd('createLink', url);
    }
    toast.success('Enlace insertado');
  };

  const addImage = () => {
    saveSelection();
    setIsImageModalOpen(true);
  };

  const handleImageFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/documents/upload?entityType=campaign_asset&entityId=0', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const filename = res.data?.filename;
      if (filename) {
        const absoluteUrl = `${window.location.origin}/api/documents/${filename}`;
        restoreSelection();
        execCmd('insertImage', absoluteUrl);
        toast.success('Imagen subida e insertada correctamente.');
        setIsImageModalOpen(false);
      } else {
        toast.error('La respuesta del servidor no contiene el nombre de archivo.');
      }
    } catch (err: any) {
      console.error('[HtmlEditor] Upload failed:', err);
      toast.error(err.response?.data?.message || 'Error al subir la imagen.');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleInsertImageUrl = () => {
    if (imageUrlInput.trim()) {
      restoreSelection();
      execCmd('insertImage', imageUrlInput.trim());
      setImageUrlInput('');
      setIsImageModalOpen(false);
      toast.success('Imagen insertada correctamente.');
    }
  };

  return (
    <div className="border-2 border-gray-200 rounded-none overflow-hidden bg-white shadow-sm focus-within:border-pureza-blue focus-within:ring-2 focus-within:ring-pureza-blue/15 transition-all">
      {/* Editor tabs & Variable inserter */}
      <div className="bg-gray-50 border-b-2 border-gray-200 p-2 flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-1 items-center">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleSwitchMode('visual')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
              viewMode === 'visual' ? 'bg-pureza-blue text-white shadow-sm font-bold' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> Editor Visual
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleSwitchMode('code')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
              viewMode === 'code' ? 'bg-pureza-blue text-white shadow-sm font-bold' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Code className="w-3.5 h-3.5" /> Código HTML
          </button>
        </div>

        {/* Dynamic variables */}
        <div className="flex gap-1.5 items-center flex-wrap">
          <span className="text-[10px] uppercase font-bold text-gray-400">Insertar Variable:</span>
          {[
            { tag: '{contact_name}', label: 'Contacto' },
            { tag: '{client_name}', label: 'Empresa' },
            { tag: '{client_code}', label: 'Código' },
          ].map(v => (
            <button
              key={v.tag}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insertVariable(v.tag)}
              className="bg-pureza-blue/10 hover:bg-pureza-blue/20 text-pureza-blue font-bold uppercase px-2.5 py-1 text-[10px] border border-pureza-blue/25 transition-colors cursor-pointer"
              title={`Insertar ${v.tag}`}
            >
              + {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Mode Rich Toolbar */}
      {viewMode === 'visual' && (
        <div className="bg-gray-50/90 border-b border-gray-200 px-3 py-2 flex flex-wrap gap-1 items-center">
          {/* Headings / Block Dropdown */}
          <select
            aria-label="Formato de texto"
            onMouseDown={(e) => e.stopPropagation()}
            onChange={(e) => handleFormatBlock(e.target.value)}
            className="text-xs bg-white border border-gray-200 rounded px-2 py-1 font-semibold text-gray-700 outline-none hover:border-gray-300"
            defaultValue=""
          >
            <option value="" disabled>Estilo...</option>
            <option value="<p>">Párrafo Normal</option>
            <option value="<h1>">Título Grande (H1)</option>
            <option value="<h2>">Título Mediano (H2)</option>
            <option value="<h3>">Título Pequeño (H3)</option>
            <option value="<blockquote>">Cita / Destacado</option>
          </select>

          <div className="h-5 w-[1px] bg-gray-200 mx-1" />

          {/* Inline Text Formatting Buttons */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd('bold')}
            className={cn(
              "p-1.5 rounded hover:bg-gray-200 transition-colors cursor-pointer",
              activeFormats.bold ? "bg-pureza-blue text-white shadow-xs" : "text-gray-700"
            )}
            title="Negrita (B)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd('italic')}
            className={cn(
              "p-1.5 rounded hover:bg-gray-200 transition-colors cursor-pointer",
              activeFormats.italic ? "bg-pureza-blue text-white shadow-xs" : "text-gray-700"
            )}
            title="Cursiva (I)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd('underline')}
            className={cn(
              "p-1.5 rounded hover:bg-gray-200 transition-colors cursor-pointer",
              activeFormats.underline ? "bg-pureza-blue text-white shadow-xs" : "text-gray-700"
            )}
            title="Subrayado (U)"
          >
            <Underline className="w-4 h-4" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd('strikeThrough')}
            className={cn(
              "p-1.5 rounded hover:bg-gray-200 transition-colors cursor-pointer",
              activeFormats.strikeThrough ? "bg-pureza-blue text-white shadow-xs" : "text-gray-700"
            )}
            title="Tachado (S)"
          >
            <Strikethrough className="w-4 h-4" />
          </button>

          <div className="h-5 w-[1px] bg-gray-200 mx-1" />

          {/* Alignments */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd('justifyLeft')}
            className={cn(
              "p-1.5 rounded hover:bg-gray-200 transition-colors cursor-pointer",
              activeFormats.justifyLeft ? "bg-pureza-blue text-white shadow-xs" : "text-gray-700"
            )}
            title="Alinear a la Izquierda"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd('justifyCenter')}
            className={cn(
              "p-1.5 rounded hover:bg-gray-200 transition-colors cursor-pointer",
              activeFormats.justifyCenter ? "bg-pureza-blue text-white shadow-xs" : "text-gray-700"
            )}
            title="Centrar Texto"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd('justifyRight')}
            className={cn(
              "p-1.5 rounded hover:bg-gray-200 transition-colors cursor-pointer",
              activeFormats.justifyRight ? "bg-pureza-blue text-white shadow-xs" : "text-gray-700"
            )}
            title="Alinear a la Derecha"
          >
            <AlignRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd('justifyFull')}
            className={cn(
              "p-1.5 rounded hover:bg-gray-200 transition-colors cursor-pointer",
              activeFormats.justifyFull ? "bg-pureza-blue text-white shadow-xs" : "text-gray-700"
            )}
            title="Justificar Texto"
          >
            <AlignJustify className="w-4 h-4" />
          </button>

          <div className="h-5 w-[1px] bg-gray-200 mx-1" />

          {/* Lists */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd('insertUnorderedList')}
            className={cn(
              "p-1.5 rounded hover:bg-gray-200 transition-colors cursor-pointer",
              activeFormats.insertUnorderedList ? "bg-pureza-blue text-white shadow-xs" : "text-gray-700"
            )}
            title="Lista con Viñetas"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd('insertOrderedList')}
            className={cn(
              "p-1.5 rounded hover:bg-gray-200 transition-colors cursor-pointer",
              activeFormats.insertOrderedList ? "bg-pureza-blue text-white shadow-xs" : "text-gray-700"
            )}
            title="Lista Numerada"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          <div className="h-5 w-[1px] bg-gray-200 mx-1" />

          {/* Color Picker */}
          <label
            className="flex items-center gap-1 p-1 rounded hover:bg-gray-200 cursor-pointer text-gray-700 text-xs font-semibold"
            title="Color de Texto"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Palette className="w-4 h-4 text-gray-600" />
            <input
              type="color"
              onChange={handleTextColor}
              className="w-5 h-5 cursor-pointer rounded border-0 p-0 bg-transparent"
              title="Seleccionar color de texto"
            />
          </label>

          <div className="h-5 w-[1px] bg-gray-200 mx-1" />

          {/* Links, Media & Utilities */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={openLinkModal}
            className="p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
            title="Insertar Enlace Web"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={addImage}
            className="p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
            title="Insertar Imagen"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd('insertHorizontalRule')}
            className="p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
            title="Línea Divisoria (HR)"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd('removeFormat')}
            className="p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
            title="Limpiar Formato"
          >
            <Eraser className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Editor Content Area */}
      <div className="p-2 min-h-[320px] bg-white">
        {viewMode === 'visual' ? (
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleVisualChange}
            onBlur={handleVisualChange}
            onKeyUp={updateActiveFormats}
            onMouseUp={updateActiveFormats}
            onSelect={updateActiveFormats}
            className="w-full min-h-[300px] p-4 outline-none text-sm text-gray-800 border border-gray-100 rounded overflow-y-auto rich-email-editor-content focus:border-pureza-blue/40"
            data-placeholder={placeholder}
            style={{ minHeight: '300px' }}
          />
        ) : (
          <textarea
            value={htmlValue}
            onChange={handleCodeChange}
            className="w-full min-h-[300px] p-4 outline-none font-mono text-xs text-slate-800 border border-gray-100 rounded focus:border-pureza-blue/40 focus:ring-0 resize-y bg-slate-50 font-medium"
            placeholder="Escribe o pega aquí tu código HTML..."
            style={{ minHeight: '300px' }}
          />
        )}
      </div>

      {/* Link Insertion Modal */}
      <Modal
        open={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        title="Insertar Enlace"
        size="sm"
      >
        <div className="flex flex-col gap-3">
          <Input
            label="Texto a Mostrar (Opcional)"
            placeholder="Texto del enlace..."
            value={linkText}
            onChange={(e) => setLinkText(e.target.value)}
          />
          <Input
            label="Dirección URL *"
            placeholder="https://ejemplo.com"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="ghost" onClick={() => setIsLinkModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleApplyLink} disabled={!linkUrl.trim()}>
              Insertar Enlace
            </Button>
          </div>
        </div>
      </Modal>

      {/* Image Insertion Modal */}
      <Modal
        open={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        title="Insertar Imagen"
        size="md"
      >
        <div className="flex flex-col gap-4">
          <div className="flex border-b border-gray-200">
            <button
              type="button"
              onClick={() => setImageTab('upload')}
              className={cn(
                "flex-1 pb-2 text-sm font-semibold border-b-2 text-center transition-colors cursor-pointer",
                imageTab === 'upload'
                  ? "border-pureza-blue text-pureza-blue font-bold"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              )}
            >
              Subir desde PC
            </button>
            <button
              type="button"
              onClick={() => setImageTab('url')}
              className={cn(
                "flex-1 pb-2 text-sm font-semibold border-b-2 text-center transition-colors cursor-pointer",
                imageTab === 'url'
                  ? "border-pureza-blue text-pureza-blue font-bold"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              )}
            >
              Enlace de Imagen (URL)
            </button>
          </div>

          {imageTab === 'upload' ? (
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 hover:border-pureza-blue/50 transition-colors bg-gray-50">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageFileSelected}
                disabled={isUploadingImage}
              />
              <ImageIcon className={cn("w-10 h-10 mb-2 transition-colors", isUploadingImage ? "text-pureza-blue animate-bounce" : "text-gray-400")} />
              {isUploadingImage ? (
                <p className="text-sm font-medium text-gray-600">Subiendo imagen...</p>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Selecciona una imagen de tu computadora</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Buscar Archivo
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase text-gray-400">Dirección URL de la Imagen</label>
                <Input
                  type="text"
                  placeholder="https://ejemplo.com/imagen.jpg"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsImageModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleInsertImageUrl}
                  disabled={!imageUrlInput.trim()}
                >
                  Insertar Imagen
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

// --- CampaignsModule Component ---
export function CampaignsModule() {
  const qc = useQueryClient();
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllSegments, setShowAllSegments] = useState(false);
  
  // Recipient filtering
  const [recipSearch, setRecipSearch] = useState('');
  const [recipStatusFilter, setRecipStatusFilter] = useState<'all' | 'sent' | 'failed' | 'opened' | 'clicked'>('all');

  // New actions states
  const [deletingCampaign, setDeletingCampaign] = useState(false);
  const [retryingCampaign, setRetryingCampaign] = useState(false);
  const [resendingUnopened, setResendingUnopened] = useState(false);

  const handleDeleteCampaign = async () => {
    if (!selectedCampaignId) return;
    if (!confirm('¿Estás seguro de que deseas eliminar esta campaña y todo su historial de envíos? Esta acción no se puede deshacer.')) return;
    
    setDeletingCampaign(true);
    try {
      await api.delete(`/campaigns/${selectedCampaignId}`);
      toast.success('Campaña eliminada correctamente');
      setSelectedCampaignId(null);
      qc.invalidateQueries({ queryKey: ['campaigns'] });
    } catch (err: any) {
      toast.error('Error al eliminar la campaña: ' + (err.response?.data?.message || err.message));
    } finally {
      setDeletingCampaign(false);
    }
  };

  const handleRetryCampaign = async () => {
    if (!selectedCampaignId) return;
    setRetryingCampaign(true);
    try {
      const res = await api.post(`/campaigns/${selectedCampaignId}/retry`);
      toast.success(`Reintento iniciado para ${res.data.count} correos fallidos.`);
      refetchDetails();
      qc.invalidateQueries({ queryKey: ['campaigns'] });
    } catch (err: any) {
      toast.error('Error al reintentar envíos: ' + (err.response?.data?.message || err.message));
    } finally {
      setRetryingCampaign(false);
    }
  };

  const handleRetrySingle = async (logId: string) => {
    try {
      await api.post(`/campaigns/logs/${logId}/retry`);
      toast.success('Reintento de envío iniciado.');
      refetchDetails();
      qc.invalidateQueries({ queryKey: ['campaigns'] });
    } catch (err: any) {
      toast.error('Error al reintentar el envío: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleResendUnopened = async () => {
    if (!selectedCampaignId) return;
    if (!confirm('¿Estás seguro de que deseas reenviar esta campaña a los contactos que no la abrieron? Se generarán nuevos registros de envío.')) return;
    
    setResendingUnopened(true);
    try {
      const res = await api.post(`/campaigns/${selectedCampaignId}/resend-unopened`, {});
      toast.success(`Reenvío iniciado para ${res.data.count} contactos que no abrieron.`);
      refetchDetails();
      qc.invalidateQueries({ queryKey: ['campaigns'] });
    } catch (err: any) {
      toast.error('Error al reenviar: ' + (err.response?.data?.message || err.message));
    } finally {
      setResendingUnopened(false);
    }
  };

  const [showPreviewContent, setShowPreviewContent] = useState(false);

  const handleDuplicateCampaign = () => {
    if (!detailedCampaign) return;
    setForm({
      subject: `${detailedCampaign.subject} (Copia)`,
      content: detailedCampaign.content || '',
      segments: [],
      statuses: [],
    });
    setModalOpen(true);
    toast.success('Campaña duplicada cargada en el editor.');
  };

  // Form states
  const [form, setForm] = useState({
    subject: '',
    content: '<div style="font-family: sans-serif; color: #333; padding: 15px;"><p>Hola <strong>{contact_name}</strong>,</p><p>Queríamos ponernos en contacto contigo desde <strong>PUREZA</strong> para comentarte...</p><p>Saludos cordiales,<br/>El equipo de PUREZA</p></div>',
    segments: [] as string[],
    statuses: [] as string[],
  });

  // Queries
  const { data: campaigns = [], isLoading: loadingCampaigns } = useQuery<any[]>({
    queryKey: ['campaigns'],
    queryFn: () => api.get('/campaigns').then(r => r.data),
  });

  const { data: detailedCampaign, isLoading: loadingDetails, refetch: refetchDetails } = useQuery<any>({
    queryKey: ['campaign', selectedCampaignId],
    queryFn: () => api.get(`/campaigns/${selectedCampaignId}`).then(r => r.data),
    enabled: selectedCampaignId !== null,
  });

  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ['clients'],
    queryFn: () => api.get('/clients').then(r => r.data),
  });

  const { data: contacts = [] } = useQuery<any[]>({
    queryKey: ['contacts'],
    queryFn: () => api.get('/contacts').then(r => r.data),
  });

  // Get unique segments
  const uniqueSegments = Array.from(
    new Set(clients.map(c => c.segment).filter(Boolean))
  ) as string[];

  // Mutate
  const createMut = useMutation({
    mutationFn: (data: any) => api.post('/campaigns', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      setModalOpen(false);
      setForm({
        subject: '',
        content: '<div style="font-family: sans-serif; color: #333; padding: 15px;"><p>Hola <strong>{contact_name}</strong>,</p><p>Queríamos ponernos en contacto contigo desde <strong>PUREZA</strong> para comentarte...</p><p>Saludos cordiales,<br/>El equipo de PUREZA</p></div>',
        segments: [],
        statuses: [],
      });
      toast.success('Campaña creada. Enviando correos en segundo plano.');
    },
    onError: (err: any) => {
      toast.error('Error al crear campaña: ' + (err.response?.data?.message || err.message));
    },
  });

  // Calculate estimated recipients in real-time
  const getEstimatedContactsCount = () => {
    return contacts.filter((contact: any) => {
      if (!contact.email) return false;
      const matchesSegment = form.segments.length === 0 || form.segments.includes('all') || form.segments.includes(contact.client?.segment);
      const matchesStatus = form.statuses.length === 0 || form.statuses.includes('all') || form.statuses.includes(contact.client?.status || 'Grey');
      return matchesSegment && matchesStatus;
    }).length;
  };

  const handleSegmentToggle = (segment: string) => {
    setForm(f => {
      let next = [...f.segments];
      if (segment === 'all') {
        next = next.includes('all') ? [] : ['all'];
      } else {
        // Remove 'all'
        next = next.filter(s => s !== 'all');
        if (next.includes(segment)) {
          next = next.filter(s => s !== segment);
        } else {
          next.push(segment);
        }
      }
      return { ...f, segments: next };
    });
  };

  const handleStatusToggle = (status: string) => {
    setForm(f => {
      let next = [...f.statuses];
      if (status === 'all') {
        next = next.includes('all') ? [] : ['all'];
      } else {
        next = next.filter(s => s !== 'all');
        if (next.includes(status)) {
          next = next.filter(s => s !== status);
        } else {
          next.push(status);
        }
      }
      return { ...f, statuses: next };
    });
  };

  const handleCreateCampaign = () => {
    if (!form.subject.trim()) {
      toast.error('El asunto es requerido');
      return;
    }
    if (!form.content.trim() || form.content === '<br>') {
      toast.error('El cuerpo del mensaje no puede estar vacío');
      return;
    }
    const finalSegments = form.segments.length === 0 ? ['all'] : form.segments;
    const finalStatuses = form.statuses.length === 0 ? ['all'] : form.statuses;
    createMut.mutate({
      subject: form.subject,
      content: form.content,
      segments: finalSegments,
      statuses: finalStatuses,
    });
  };

  // Filter campaigns
  const filteredCampaigns = campaigns.filter(c =>
    c.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter detailed recipient logs
  const filteredLogs = detailedCampaign?.logs?.filter((log: any) => {
    const matchesSearch =
      log.contact?.name?.toLowerCase().includes(recipSearch.toLowerCase()) ||
      log.recipientEmail?.toLowerCase().includes(recipSearch.toLowerCase()) ||
      log.client?.businessName?.toLowerCase().includes(recipSearch.toLowerCase());

    if (!matchesSearch) return false;

    if (recipStatusFilter === 'all') return true;
    if (recipStatusFilter === 'sent') return log.status === 'sent' && log.openCount === 0;
    if (recipStatusFilter === 'failed') return log.status === 'failed';
    if (recipStatusFilter === 'opened') return log.openCount > 0 && log.clickCount === 0;
    if (recipStatusFilter === 'clicked') return log.clickCount > 0;

    return true;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Split screen layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Campaign List Sidebar */}
        <div className={cn("col-span-1 lg:col-span-1 space-y-4", selectedCampaignId !== null && "hidden lg:block")}>
          <div className="flex items-center justify-between gap-2">
            <div className="relative flex-1">
              <Input
                icon={<Search className="w-4 h-4" />}
                placeholder="Buscar campañas..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Button icon={<Plus className="w-4 h-4" />} onClick={() => setModalOpen(true)}>
              Nueva
            </Button>
          </div>

          <Card className="h-[calc(100vh-220px)] overflow-y-auto">
            <CardHeader className="flex justify-between items-center py-4 bg-gray-50 border-b-2 border-gray-100">
              <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Historial de Campañas</h3>
              <Badge variant="neutral">{filteredCampaigns.length}</Badge>
            </CardHeader>
            <CardBody className="p-0 divide-y-2 divide-gray-100">
              {loadingCampaigns ? (
                <div className="p-8 text-center text-gray-400 text-sm flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Cargando campañas...
                </div>
              ) : filteredCampaigns.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                  No se encontraron campañas.
                </div>
              ) : (
                filteredCampaigns.map(c => {
                  const hasStats = c.stats;
                  const total = hasStats?.total || 0;
                  const opened = hasStats?.opened || 0;
                  const clicked = hasStats?.clicked || 0;
                  const openRate = total > 0 ? Math.round((opened / total) * 100) : 0;
                  const clickRate = total > 0 ? Math.round((clicked / total) * 100) : 0;
                  const isActive = selectedCampaignId === c.id;

                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCampaignId(c.id)}
                      className={cn(
                        "p-4 cursor-pointer hover:bg-gray-50 transition-colors border-l-4",
                        isActive ? "bg-pureza-blue/5 border-pureza-blue" : "border-transparent"
                      )}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-sm text-gray-900 line-clamp-1 flex-1 pr-2">
                          {c.subject}
                        </h4>
                        <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{format(new Date(c.createdAt), 'dd MMM yyyy, HH:mm', { locale: es })}</span>
                      </div>

                      {/* Stats mini bar */}
                      <div className="grid grid-cols-4 gap-2 text-center text-[10px] uppercase font-bold tracking-wider">
                        <div className="bg-gray-100 rounded p-1">
                          <p className="text-gray-900 font-extrabold text-xs">{total}</p>
                          <p className="text-gray-400 scale-90">Enviados</p>
                        </div>
                        <div className="bg-emerald-50 text-emerald-700 rounded p-1">
                          <p className="font-extrabold text-xs">{openRate}%</p>
                          <p className="text-emerald-500 scale-90">Abiertos</p>
                        </div>
                        <div className="bg-pink-50 text-pink-700 rounded p-1">
                          <p className="font-extrabold text-xs">{clickRate}%</p>
                          <p className="text-pink-500 scale-90">Clics</p>
                        </div>
                        <div className="bg-amber-50 text-amber-700 rounded p-1">
                          <p className="font-extrabold text-xs">{hasStats?.failed || 0}</p>
                          <p className="text-amber-500 scale-90">Error</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardBody>
          </Card>
        </div>

        {/* Campaign Detail Pane */}
        <div className={cn("col-span-1 lg:col-span-2", selectedCampaignId === null && "hidden lg:block")}>
          {selectedCampaignId === null ? (
            <Card className="h-[calc(100vh-160px)] flex flex-col items-center justify-center text-center p-8 bg-gray-50/50 border-dashed border-2">
              <Mail className="w-12 h-12 text-gray-300 mb-4 stroke-1" />
              <h3 className="font-bold text-gray-700 text-base mb-1">Ninguna campaña seleccionada</h3>
              <p className="text-gray-400 text-sm max-w-sm">
                Selecciona una campaña del listado lateral para ver su reporte de apertura y clics en tiempo real, o crea una nueva campaña de correo.
              </p>
            </Card>
          ) : loadingDetails ? (
            <Card className="h-[calc(100vh-160px)] flex items-center justify-center text-gray-400 text-sm">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Cargando reporte detallado...
            </Card>
          ) : !detailedCampaign ? (
            <Card className="h-[calc(100vh-160px)] flex items-center justify-center text-red-500 text-sm">
              No se pudo cargar la información de la campaña.
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Detail Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-white border-2 border-gray-100 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="lg:hidden p-2"
                    icon={<ArrowLeft className="w-4 h-4" />}
                    onClick={() => setSelectedCampaignId(null)}
                  >
                    Volver
                  </Button>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{detailedCampaign.subject}</h2>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> Creado por {detailedCampaign.sentBy?.name || 'Sistema'}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {format(new Date(detailedCampaign.createdAt), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-gray-700 border-2 border-gray-200 hover:border-pureza-blue hover:bg-pureza-blue/5 hover:text-pureza-blue font-bold cursor-pointer"
                    icon={<Copy className="w-3.5 h-3.5" />} 
                    onClick={handleDuplicateCampaign}
                    title="Duplicar esta campaña para editarla y enviarla nuevamente"
                  >
                    Duplicar Campaña
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={cn(
                      "border-2 font-bold cursor-pointer transition-colors",
                      showPreviewContent 
                        ? "border-pureza-blue text-pureza-blue bg-pureza-blue/5" 
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                    )}
                    icon={<Eye className="w-3.5 h-3.5" />} 
                    onClick={() => setShowPreviewContent(!showPreviewContent)}
                    title="Ver u ocultar el contenido del correo enviado"
                  >
                    {showPreviewContent ? 'Ocultar Correo' : 'Ver Correo'}
                  </Button>
                  {detailedCampaign.stats.sent > detailedCampaign.stats.opened && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-pureza-blue border-2 border-pureza-blue/20 hover:border-pureza-blue hover:bg-pureza-blue/5 cursor-pointer"
                      icon={<RefreshCw className="w-3.5 h-3.5" />} 
                      onClick={handleResendUnopened}
                      loading={resendingUnopened}
                    >
                      Reenviar a No Abridores
                    </Button>
                  )}
                  {detailedCampaign.stats.failed > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-amber-600 border-2 border-amber-200 hover:border-amber-300 hover:bg-amber-50 cursor-pointer"
                      icon={<RefreshCw className="w-3.5 h-3.5" />} 
                      onClick={handleRetryCampaign}
                      loading={retryingCampaign}
                    >
                      Reintentar Fallidos
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={() => refetchDetails()} title="Actualizar estadísticas" className="cursor-pointer">
                    Actualizar
                  </Button>
                  <Button 
                    variant="danger" 
                    size="sm" 
                    icon={<Trash2 className="w-3.5 h-3.5" />} 
                    onClick={handleDeleteCampaign}
                    loading={deletingCampaign}
                    className="cursor-pointer"
                  >
                    Eliminar
                  </Button>
                </div>
              </div>

              {/* Stats Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  title="Enviados"
                  value={detailedCampaign.stats.total}
                  icon={<Mail className="w-6 h-6 text-white" />}
                  color="blue"
                />
                <StatCard
                  title="Abiertos"
                  value={`${detailedCampaign.stats.opened} (${detailedCampaign.stats.total > 0 ? Math.round((detailedCampaign.stats.opened / detailedCampaign.stats.total) * 100) : 0}%)`}
                  icon={<CheckCircle2 className="w-6 h-6 text-white" />}
                  color="emerald"
                />
                <StatCard
                  title="Clics"
                  value={`${detailedCampaign.stats.clicked} (${detailedCampaign.stats.total > 0 ? Math.round((detailedCampaign.stats.clicked / detailedCampaign.stats.total) * 100) : 0}%)`}
                  icon={<ExternalLink className="w-6 h-6 text-white" />}
                  color="pink"
                />
                <StatCard
                  title="Fallidos"
                  value={detailedCampaign.stats.failed}
                  icon={<XCircle className="w-6 h-6 text-white" />}
                  color="amber"
                />
              </div>

              {/* Optional Email Preview Card */}
              {showPreviewContent && (
                <Card className="border-2 border-pureza-blue/30 shadow-sm">
                  <CardHeader className="bg-pureza-blue/5 border-b border-pureza-blue/15 flex items-center justify-between p-4">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-pureza-blue" />
                      <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider">
                        Contenido del Correo Enviado (Plantilla Base)
                      </h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs font-bold text-pureza-blue hover:underline cursor-pointer"
                      onClick={handleDuplicateCampaign}
                      icon={<Copy className="w-3.5 h-3.5" />}
                    >
                      Editar en Nueva Campaña
                    </Button>
                  </CardHeader>
                  <CardBody className="p-6 bg-white">
                    <div
                      className="rich-email-editor-content border border-gray-100 p-4 rounded bg-gray-50/50 max-h-[350px] overflow-y-auto"
                      dangerouslySetInnerHTML={{ __html: detailedCampaign.content || '<p className="text-gray-400 italic">Sin contenido</p>' }}
                    />
                  </CardBody>
                </Card>
              )}

              {/* Detailed logs table */}
              <Card>
                <CardHeader className="bg-gray-50 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3 p-4">
                  <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Seguimiento de Destinatarios</h3>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Input
                        icon={<Search className="w-3.5 h-3.5" />}
                        placeholder="Buscar destinatario..."
                        value={recipSearch}
                        onChange={e => setRecipSearch(e.target.value)}
                        className="py-1.5 px-3 text-xs w-48"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Filter className="w-3.5 h-3.5" />
                      <select
                        value={recipStatusFilter}
                        onChange={e => setRecipStatusFilter(e.target.value as any)}
                        className="border border-gray-200 bg-white px-2 py-1.5 rounded-none font-bold uppercase text-[10px] outline-none"
                      >
                        <option value="all">TODOS</option>
                        <option value="sent">ENVIADOS (SIN ABRIR)</option>
                        <option value="opened">ABIERTOS</option>
                        <option value="clicked">CLICADOS</option>
                        <option value="failed">FALLIDOS</option>
                      </select>
                    </div>
                  </div>
                </CardHeader>
                <CardBody className="p-0 overflow-x-auto max-h-[400px]">
                  {filteredLogs.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">
                      No se encontraron destinatarios que coincidan.
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          <th className="px-4 py-3">Cliente / Empresa</th>
                          <th className="px-4 py-3">Contacto</th>
                          <th className="px-4 py-3">Estado</th>
                          <th className="px-4 py-3 text-center">Aperturas</th>
                          <th className="px-4 py-3 text-center">Clics</th>
                          <th className="px-4 py-3">Fechas</th>
                          <th className="px-4 py-3 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-xs">
                        {filteredLogs.map((log: any) => {
                          let statusBadge = <Badge variant="neutral">Enviado</Badge>;
                          if (log.status === 'failed') {
                            statusBadge = (
                              <span className="cursor-help" title={log.error}>
                                <Badge variant="danger">
                                  Fallido
                                </Badge>
                              </span>
                            );
                          } else if (log.clickCount > 0) {
                            statusBadge = <Badge variant="success">Clicado</Badge>;
                          } else if (log.openCount > 0) {
                            statusBadge = <Badge variant="default">Abierto</Badge>;
                          }

                          return (
                            <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-4 py-3">
                                <p className="font-semibold text-gray-900 leading-tight">{log.client?.businessName || '—'}</p>
                                <p className="text-[10px] text-gray-400 leading-none mt-0.5">{log.client?.code || '—'}</p>
                              </td>
                              <td className="px-4 py-3">
                                <p className="font-medium text-gray-900">{log.contact?.name || '—'}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">{log.recipientEmail}</p>
                              </td>
                              <td className="px-4 py-3">{statusBadge}</td>
                              <td className="px-4 py-3 text-center font-bold text-gray-700">{log.openCount}x</td>
                              <td className="px-4 py-3 text-center font-bold text-gray-700">{log.clickCount}x</td>
                              <td className="px-4 py-3 space-y-0.5 text-[10px] text-gray-400">
                                {log.status === 'failed' && log.error && (
                                  <p className="text-red-500 font-semibold max-w-[200px] truncate" title={log.error}>
                                    Error: {log.error}
                                  </p>
                                )}
                                {log.openedAt && (
                                  <p className="text-emerald-600">
                                    Apertura: {format(new Date(log.openedAt), 'dd/MM/yyyy HH:mm')}
                                  </p>
                                )}
                                {log.clickedAt && (
                                  <p className="text-pink-600">
                                    Clic: {format(new Date(log.clickedAt), 'dd/MM/yyyy HH:mm')}
                                  </p>
                                )}
                                <p>Campaña: {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm')}</p>
                              </td>
                              <td className="px-4 py-3 text-right">
                                {log.status === 'failed' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-amber-600 hover:text-amber-700 p-1"
                                    icon={<RefreshCw className="w-3.5 h-3.5" />}
                                    onClick={() => handleRetrySingle(log.id)}
                                    title="Reintentar este envío"
                                  />
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </CardBody>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Create Campaign Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Crear Nueva Campaña de Correo"
        size="lg"
        allowMaximize={true}
      >
        <div className="space-y-4">
          <Input
            label="Asunto del Correo *"
            value={form.subject}
            onChange={e => setForm({ ...form, subject: e.target.value })}
            placeholder="Introduce el asunto del correo (ej. Novedades PUREZA - {client_name})"
          />

          {/* Segment Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                Segmentar Clientes Destinatarios
              </label>
              {uniqueSegments.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllSegments(!showAllSegments)}
                  className="text-xs font-bold text-pureza-blue hover:underline flex items-center gap-1 cursor-pointer transition-all"
                >
                  {showAllSegments ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" /> Mostrar menos
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" /> + Ver todos ({uniqueSegments.length} segmentos)
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-2 items-center">
              <button
                type="button"
                onClick={() => handleSegmentToggle('all')}
                className={cn(
                  "px-3 py-1.5 border-2 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer",
                  form.segments.includes('all') || form.segments.length === 0
                    ? "bg-pureza-blue text-white border-pureza-blue shadow-xs"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                )}
              >
                Todos los Clientes
              </button>

              {(showAllSegments
                ? uniqueSegments
                : uniqueSegments.filter((seg, idx) => idx < 5 || (form.segments.includes(seg) && !form.segments.includes('all')))
              ).map(seg => (
                <button
                  key={seg}
                  type="button"
                  onClick={() => handleSegmentToggle(seg)}
                  className={cn(
                    "px-3 py-1.5 border-2 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer",
                    form.segments.includes(seg) && !form.segments.includes('all')
                      ? "bg-pureza-blue text-white border-pureza-blue shadow-xs"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                  )}
                >
                  Segmento: {seg}
                </button>
              ))}

              {!showAllSegments && uniqueSegments.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllSegments(true)}
                  className="px-3 py-1.5 border-2 border-dashed border-gray-300 hover:border-pureza-blue text-xs font-bold text-gray-600 hover:text-pureza-blue bg-gray-50 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Ver todos los segmentos"
                >
                  <Plus className="w-3.5 h-3.5" /> {uniqueSegments.length - 5} más...
                </button>
              )}
            </div>

            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 mt-4">
              Filtrar por Estado de Cliente
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              <button
                type="button"
                onClick={() => handleStatusToggle('all')}
                className={cn(
                  "px-3 py-1.5 border-2 text-xs font-bold uppercase tracking-wider transition-colors",
                  form.statuses.includes('all') || form.statuses.length === 0
                    ? "bg-pureza-blue text-white border-pureza-blue"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                )}
              >
                Todos los Estados
              </button>
              {[
                { id: 'Green', label: 'Activo' },
                { id: 'Yellow', label: 'Atención' },
                { id: 'Red', label: 'Riesgo' },
                { id: 'Grey', label: 'Inactivo' }
              ].map(status => (
                <button
                  key={status.id}
                  type="button"
                  onClick={() => handleStatusToggle(status.id)}
                  className={cn(
                    "px-3 py-1.5 border-2 text-xs font-bold uppercase tracking-wider transition-colors",
                    form.statuses.includes(status.id) && !form.statuses.includes('all')
                      ? "bg-pureza-blue text-white border-pureza-blue"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                  )}
                >
                  Estado: {status.label}
                </button>
              ))}
            </div>
            
            <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-2 bg-gray-50 p-2.5 border border-gray-200">
              <AlertCircle className="w-3.5 h-3.5 text-pureza-blue shrink-0" />
              <span>
                Esta campaña será enviada a aproximadamente{' '}
                <strong className="text-gray-900 font-extrabold">{getEstimatedContactsCount()}</strong> contactos que
                tienen correo electrónico registrado.
              </span>
            </p>
          </div>

          {/* Complete HTML Editor */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              Cuerpo del Correo (Editor Completo HTML)
            </label>
            <HtmlEditor
              value={form.content}
              onChange={val => setForm({ ...form, content: val })}
              placeholder="Escribe el contenido de tu correo..."
            />
          </div>

          <div className="flex gap-3 pt-2 justify-end">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateCampaign}
              loading={createMut.isPending}
              icon={<Mail className="w-4 h-4" />}
            >
              Enviar Campaña Masiva
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
