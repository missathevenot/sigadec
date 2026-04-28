import { C } from '../../constants/colors';

export default function Modal({ title, sub, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', alignItems: 'flex-end',
      background: 'rgba(0,0,0,.45)',
      maxWidth: 430, margin: '0 auto',
    }}>
      <div style={{
        background: C.blanc,
        borderRadius: '18px 18px 0 0',
        width: '100%',
        maxHeight: '92vh',
        overflowY: 'auto',
        padding: '20px 18px 32px',
        boxSizing: 'border-box',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 16, color: C.txt }}>{title}</div>
            {sub && <div style={{ fontSize: 12, color: C.sec, marginTop: 2 }}>{sub}</div>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: C.sec, lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
