import { C } from '../../constants/colors';

export default function Av({ u, sz = 36 }) {
  if (!u) return null;
  const initials = `${(u.prenom || '')[0] || ''}${(u.nom || '')[0] || ''}`.toUpperCase();
  return (
    <div style={{
      width: sz, height: sz,
      borderRadius: '50%',
      background: C.vert,
      color: C.blanc,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700,
      fontSize: sz * 0.38,
      flexShrink: 0,
      fontFamily: 'Nunito, sans-serif',
    }}>
      {initials}
    </div>
  );
}
