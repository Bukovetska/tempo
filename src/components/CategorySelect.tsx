import React, { useState, useEffect } from 'react';
import { apiFetchCategories, apiCreateCategory, ApiCategory } from '../services/apiService';

interface CategorySelectProps {
  userId:   string;
  value:    string;
  onChange: (value: string) => void;
}

export default function CategorySelect({ userId, value, onChange }: CategorySelectProps) {
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [showAdd, setShowAdd]       = useState<boolean>(false);
  const [newLabel, setNewLabel]     = useState<string>('');
  const [error, setError]           = useState<string>('');
  const [saving, setSaving]         = useState<boolean>(false);

  useEffect(() => {
    apiFetchCategories().then(setCategories).catch(console.error);
  }, []);

  async function handleAdd(): Promise<void> {
    if (!newLabel.trim()) { setError('Введіть назву'); return; }
    if (newLabel.trim().length < 2) { setError('Занадто коротка'); return; }

    setSaving(true);
    try {
      const newCat = await apiCreateCategory(newLabel.trim());
      const updated = await apiFetchCategories();
      setCategories(updated);
      onChange(newCat.id);
      setNewLabel('');
      setShowAdd(false);
      setError('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Помилка';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <select
        value={value}
        onChange={(e) => {
          if (e.target.value === '__add__') {
            setShowAdd(true);
            setError('');
          } else {
            onChange(e.target.value);
          }
        }}
        className="input"
      >
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>{cat.label}</option>
        ))}
        <option value="__add__">+ Додати категорію...</option>
      </select>

      {showAdd && (
        <div className="add-category-block">
          <p className="add-category-title">Нова категорія</p>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              value={newLabel}
              onChange={(e) => { setNewLabel(e.target.value); setError(''); }}
              placeholder="Назва категорії..."
              className={`input ${error ? 'input-error' : ''}`}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
                if (e.key === 'Escape') { setShowAdd(false); setError(''); }
              }}
            />
            <button className="btn-primary" onClick={handleAdd} disabled={saving} style={{ flexShrink: 0 }}>
              {saving ? '...' : 'Додати'}
            </button>
            <button
              className="btn-secondary"
              onClick={() => { setShowAdd(false); setError(''); setNewLabel(''); }}
              style={{ flexShrink: 0 }}
            >
              ✕
            </button>
          </div>
          {error && <p className="error-text" style={{ marginTop: '4px' }}>{error}</p>}
        </div>
      )}
    </div>
  );
}