import { C } from '../../constants/colors';

export default function Textarea({ label, value, onChange, placeholder = '', rows = 3, required = false }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && (
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.sec, marginBottom: 4 }}>
          {label}{required && <span style={{ color: C.urg }}> *</span>}
        </label>
      )}
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        style={{
          width: '100%',
          border: `1.5px solid ${C.bord}`,
          borderRadius: 9,
          padding: '9px 12px',
          fontSize: 14,
          color: C.txt,
          background: C.blanc,
          fontFamily: 'Inter, sans-serif',
          outline: 'none',
          resize: 'vertical',
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
}
