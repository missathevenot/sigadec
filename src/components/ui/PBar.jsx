import { C } from '../../constants/colors';

export default function PBar({ v = 0, col }) {
  const color = col || (v >= 100 ? C.vert : v > 50 ? C.cours : C.orng);
  return (
    <div style={{ background: C.bord, borderRadius: 6, height: 7, overflow: 'hidden', width: '100%' }}>
      <div style={{
        width: `${Math.min(100, Math.max(0, v))}%`,
        background: color,
        height: '100%',
        borderRadius: 6,
        transition: 'width .3s ease',
      }} />
    </div>
  );
}
