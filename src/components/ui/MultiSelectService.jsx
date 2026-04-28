import { useState } from 'react';
import { C } from '../../constants/colors';
import { SERVICES } from '../../constants/services';

export default function MultiSelectService({ selected = [], onChange, label = 'Services', required = false }) {
  const [open, setOpen] = useState(false);

  const toggle = (id) => {
    if (selected.includes(id)) {
      onChange(selected.filter(s => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const remove = (id, e) => {
    e.stopPropagation();
    onChange(selected.filter(s => s !== id));
  };

  return (
    <div style={{ marginBottom: 12, position: 'relative' }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.sec, marginBottom: 4 }}>
        {label}{required && <span style={{ color: C.urg }}> *</span>}
      </label>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          border: `1.5px solid ${C.bord}`,
          borderRadius: 9, padding: '8px 12px', cursor: 'pointer',
          background: C.blanc, minHeight: 40,
          display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center',
        }}
      >
        {selected.length === 0 && <span style={{ color: C.sec, fontSize: 13 }}>Sélectionner des services…</span>}
        {selected.map(id => {
          const svc = SERVICES.find(s => s.id === id);
          return svc ? (
            <span key={id} style={{
              background: C.vertL, color: C.vert,
              borderRadius: 12, fontSize: 11, fontWeight: 600,
              padding: '2px 8px', display: 'flex', alignItems: 'center', gap: 4,
            }}>
              {svc.abbr}
              <span onClick={e => remove(id, e)} style={{ cursor: 'pointer', fontWeight: 700 }}>×</span>
            </span>
          ) : null;
        })}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: C.sec }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: C.blanc, border: `1.5px solid ${C.bord}`,
          borderRadius: 9, boxShadow: '0 4px 16px rgba(0,0,0,.12)',
          maxHeight: 200, overflowY: 'auto',
        }}>
          {SERVICES.map(svc => (
            <label key={svc.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', cursor: 'pointer',
              background: selected.includes(svc.id) ? C.vertL : 'transparent',
              borderBottom: `1px solid ${C.bord}`,
              fontSize: 12,
            }}>
              <input
                type="checkbox"
                checked={selected.includes(svc.id)}
                onChange={() => toggle(svc.id)}
              />
              <span style={{ fontWeight: 600, color: C.vert, minWidth: 52 }}>{svc.abbr}</span>
              <span style={{ color: C.sec, fontSize: 11 }}>{svc.nom.substring(0, 40)}…</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
