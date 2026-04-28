import { C } from '../../constants/colors';

export default function Select({ label, value, onChange, options = [], required = false, disabled = false, placeholder = '' }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && (
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.sec, marginBottom: 4 }}>
          {label}{required && <span style={{ color: C.urg }}> *</span>}
        </label>
      )}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        style={{
          width: '100%',
          border: `1.5px solid ${C.bord}`,
          borderRadius: 9,
          padding: '9px 12px',
          fontSize: 14,
          color: value ? C.txt : C.sec,
          background: disabled ? '#F8F9FB' : C.blanc,
          fontFamily: 'Inter, sans-serif',
          outline: 'none',
          boxSizing: 'border-box',
          appearance: 'auto',
        }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
