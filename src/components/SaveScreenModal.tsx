import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { ScreenFilter } from '../types/stock';

interface SaveScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  onSave: (newScreen: ScreenFilter) => void;
}

export const SaveScreenModal: React.FC<SaveScreenModalProps> = ({
  isOpen,
  onClose,
  query,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newScreen: ScreenFilter = {
      id: `custom-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      query: query.trim(),
      category: 'Saved',
      createdAt: new Date().toISOString(),
    };

    onSave(newScreen);
    setTitle('');
    setDescription('');
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true">
      <div className="apple-card w-full max-w-lg p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-apple-border-subtle">
          <h3 className="text-subheadline font-semibold text-apple-primary flex items-center gap-2 font-display">
            Save this query
          </h3>
          <button
            onClick={onClose}
            className="apple-btn apple-btn-quiet p-1"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-caption1 font-semibold text-apple-primary mb-1">
              Name
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Midcaps, ROCE over 20"
              className="apple-input w-full text-caption1 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-caption1 font-semibold text-apple-primary mb-1">
              Note <span className="font-normal text-apple-muted">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder=""
              rows={2}
              className="apple-input w-full text-caption1 px-3 py-2 resize-none"
            />
          </div>

          <div>
            <label className="block text-caption1 font-semibold text-apple-primary mb-1">
              Query
            </label>
            <div className="apple-well p-2.5 font-mono text-caption2 text-apple-secondary max-h-24 overflow-y-auto leading-relaxed">
              {query}
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="apple-btn apple-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="apple-btn apple-btn-primary"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
