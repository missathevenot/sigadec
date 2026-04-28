import { C } from '../../constants/colors';

export default function Input({ label, value, onChange, type = 'text', placeholder = '', required = false, disabled = false, style = {} }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && (
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.sec, marginBottom: 4 }}>
          {label}{required && <span style={{ color: C.urg }}> *</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: '100%',
          border: `1.5px solid ${C.bord}`,
          borderRadius: 9,
          padding: '9px 12px',
          fontSize: 14,
          color: C.txt,
          background: disabled ? '#F8F9FB' : C.blanc,
          fontFamily: 'Inter, sans-serif',
          outline: 'none',
          boxSizing: 'border-box',
          ...style,
        }}
      />
    </div>
  );
}
