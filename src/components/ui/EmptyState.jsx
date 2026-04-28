import { C } from '../../constants/colors';

export default function EmptyState({ icon = '📭', title = 'Aucun résultat', sub = '' }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 20px', color: C.sec }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 16, color: C.txt, marginBottom: 6 }}>{title}</div>
      {sub && <div style={{ fontSize: 13, color: C.sec }}>{sub}</div>}
    </div>
  );
}
