import { C } from '../../constants/colors';

export default function Av({ u, sz = 36 }) {
  if (!u) return null;

  if (u.photoUrl) {
    return (
      <div style={{
        width: sz, height: sz, borderRadius: '50%',
        overflow: 'hidden', flexShrink: 0,
        border: `2px solid rgba(255,255,255,.3)`,
      }}>
        <img
          src={u.photoUrl}
          alt={`${u.prenom} ${u.nom}`}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
    );
  }

  const initials = `${(u.prenom || '')[0] || ''}${(u.nom || '')[0] || ''}`.toUpperCase();
  return (
    <div style={{
      width: sz, height: sz, borderRadius: '50%',
      background: C.vert, color: C.blanc,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: sz * 0.38,
      flexShrink: 0, fontFamily: 'Nunito, sans-serif',
    }}>
      {initials}
    </div>
  );
}
