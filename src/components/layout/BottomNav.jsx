import { C } from '../../constants/colors';

const ALL_TABS = [
  { id: 'dashboard',  icon: '🏠', label: 'Accueil' },
  { id: 'diligences', icon: '◎',  label: 'Diligences', hideFor: ['secretariat'] },
  { id: 'courriers',  icon: '✉️',  label: 'Courriers',  strictAdmin: true },
  { id: 'infos',      icon: '📋', label: 'Infos' },
  { id: 'mon-espace', icon: '👤', label: 'Espace' },
];

export default function BottomNav({ page, navigate, user }) {
  const tabs = ALL_TABS.filter(t => {
    if (t.hideFor?.includes(user?.role)) return false;
    if (t.strictAdmin && user?.role !== 'admin') return false;
    return true;
  });

  const isActive = (id) => page === id || (id === 'diligences' && page === 'diligence-detail') || (id === 'courriers' && page === 'courrier-detail');

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: 430, margin: '0 auto',
      height: 64, background: C.blanc, borderTop: `1px solid ${C.bord}`,
      display: 'flex', alignItems: 'center', zIndex: 50,
      boxShadow: '0 -2px 8px rgba(0,0,0,.06)',
    }}>
      {tabs.map(t => {
        const active = isActive(t.id);
        return (
          <button
            key={t.id}
            onClick={() => navigate(t.id)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 2, background: 'none', border: 'none',
              cursor: 'pointer', padding: '6px 0',
            }}
          >
            <span style={{ fontSize: 20 }}>{t.icon}</span>
            <span style={{
              fontSize: 10, fontWeight: active ? 700 : 500,
              color: active ? C.vert : C.sec,
            }}>{t.label}</span>
            {active && <span style={{ width: 4, height: 4, borderRadius: '50%', background: C.vert }} />}
          </button>
        );
      })}
    </div>
  );
}
