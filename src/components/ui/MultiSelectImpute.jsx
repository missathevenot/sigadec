import { useState, useRef, useEffect } from 'react';
import { C } from '../../constants/colors';

/**
 * Liste déroulante multi-sélection pour les champs "Imputée à" / "Imputé à".
 * Props:
 *   selected   : string[]
 *   onChange   : (string[]) => void
 *   options    : { value, label }[]
 *   label      : string
 *   placeholder: string
 */
export default function MultiSelectImpute({ selected = [], onChange, options = [], label, placeholder = 'Choisir…' }) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState('');
  const ref                 = useRef(null);

  // Fermer si clic en dehors
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (val) => {
    if (selected.includes(val)) onChange(selected.filter(v => v !== val));
    else onChange([...selected, val]);
  };

  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
  const displayText = selected.length === 0
    ? placeholder
    : selected.length === 1
      ? selected[0]
      : `${selected.length} sélectionné(s)`;

  return (
    <div ref={ref} style={{ marginBottom: 12 }}>
      {label && (
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.sec, marginBottom: 4 }}>
          {label}
        </label>
      )}

      {/* Trigger */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          border: `1.5px solid ${open ? C.vert : C.bord}`, borderRadius: 9,
          padding: '9px 12px', fontSize: 13, background: C.blanc,
          cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          color: selected.length === 0 ? C.sec : C.txt, userSelect: 'none',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {displayText}
        </span>
        <span style={{ marginLeft: 8, fontSize: 10, color: C.sec, flexShrink: 0 }}>{open ? '▲' : '▼'}</span>
      </div>

      {/* Sélections affichées sous forme de tags */}
      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
          {selected.map(v => (
            <span
              key={v}
              style={{
                background: C.vertL, color: C.vert, borderRadius: 8,
                padding: '2px 8px', fontSize: 11, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              {v}
              <span
                onClick={(e) => { e.stopPropagation(); toggle(v); }}
                style={{ cursor: 'pointer', fontWeight: 900, fontSize: 13, lineHeight: 1 }}
              >×</span>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', zIndex: 200,
          background: C.blanc, border: `1.5px solid ${C.bord}`,
          borderRadius: 10, marginTop: 2, boxShadow: '0 4px 20px rgba(0,0,0,.12)',
          maxHeight: 260, overflowY: 'auto', width: '100%', maxWidth: 380,
        }}>
          {/* Recherche interne */}
          <div style={{ padding: '8px 10px', borderBottom: `1px solid ${C.bord}` }}>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher…"
              style={{
                width: '100%', boxSizing: 'border-box',
                border: `1px solid ${C.bord}`, borderRadius: 7, padding: '5px 10px',
                fontSize: 12, outline: 'none',
              }}
            />
          </div>

          {filtered.length === 0 && (
            <div style={{ padding: '12px', fontSize: 12, color: C.sec, textAlign: 'center' }}>Aucun résultat</div>
          )}

          {filtered.map(opt => {
            const checked = selected.includes(opt.value);
            return (
              <label
                key={opt.value}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 14px', cursor: 'pointer',
                  background: checked ? C.vertL : 'transparent',
                  borderBottom: `1px solid ${C.bord}`,
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(opt.value)}
                  style={{ accentColor: C.vert, width: 15, height: 15, flexShrink: 0 }}
                />
                <span style={{ fontSize: 13, color: checked ? C.vert : C.txt, fontWeight: checked ? 700 : 400 }}>
                  {opt.label}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
