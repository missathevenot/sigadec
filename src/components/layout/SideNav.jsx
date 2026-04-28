import { C } from '../../constants/colors';
import { ROLES_LABELS } from '../../constants/roles';
import { SERVICES } from '../../constants/services';
import { canReadEmiRec } from '../../utils/access';
import Av from '../ui/Av';

const MENU_ITEMS = [
  { id: 'dashboard',     icon: '🏠', label: 'Tableau de bord' },
  { id: 'mon-espace',    icon: '👤', label: 'Mon Espace' },
  { id: 'diligences',    icon: '◎',  label: 'Diligences',           hideFor: ['secretariat'] },
  { id: 'courriers',     icon: '✉️',  label: 'Courriers' },
  { id: 'infos',         icon: '📋', label: 'Informations / Divers' },
  { id: 'rapports',      icon: '📄', label: 'Documentation' },
  { id: 'chartes',       icon: '⚖️',  label: 'Charte Éthique',       hideFor: ['secretariat'] },
  { id: 'planning',      icon: '📅', label: 'Planning Annuel',       hideFor: ['secretariat'] },
  { id: 'emi-rec',       icon: '💰', label: 'Émissions / Recettes',  emiRec: true },
  { id: 'notifications', icon: '🔔', label: 'Notifications' },
  { id: 'profile',       icon: '🪪',  label: 'Mon Profil' },
  { id: 'admin',         icon: '🛡️',  label: 'Administration',       adminOnly: true },
];

const ACTIVE_PAGES = {
  diligences: ['diligences', 'diligence-detail'],
  courriers:  ['courriers',  'courrier-detail'],
};

export default function SideNav({ user, navigate, currentPage, onLogout, unread }) {
  const svc = user?.serviceId ? SERVICES.find(s => s.id === user.serviceId) : null;

  const items = MENU_ITEMS.filter(item => {
    if (item.hideFor?.includes(user?.role)) return false;
    if (item.adminOnly && !['admin', 'directeur'].includes(user?.role)) return false;
    if (item.emiRec && !canReadEmiRec(user)) return false;
    return true;
  });

  const isActive = (id) => {
    const group = ACTIVE_PAGES[id];
    return group ? group.includes(currentPage) : currentPage === id;
  };

  return (
    <div style={{
      position: 'fixed', top: 58, left: 0, bottom: 0,
      width: 240, background: C.blanc,
      borderRight: `1px solid ${C.bord}`,
      display: 'flex', flexDirection: 'column',
      zIndex: 30, overflowY: 'auto',
    }}>
      {/* Profil utilisateur */}
      <div style={{
        background: `linear-gradient(135deg, ${C.vertF} 0%, ${C.vert} 100%)`,
        padding: '20px 16px 16px',
        display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
      }}>
        <Av u={user} sz={44} />
        <div style={{ overflow: 'hidden' }}>
          <div style={{
            color: C.blanc, fontFamily: 'Nunito, sans-serif',
            fontWeight: 800, fontSize: 14,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {user?.prenom} {user?.nom}
          </div>
          <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 11, marginTop: 2 }}>
            {ROLES_LABELS[user?.role] || user?.role}
          </div>
          {svc && (
            <div style={{
              marginTop: 4, background: 'rgba(255,255,255,.2)',
              borderRadius: 8, padding: '2px 8px',
              fontSize: 10, color: C.blanc, display: 'inline-block',
            }}>
              {svc.abbr}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, paddingBlock: 8 }}>
        {items.map(item => {
          const active = isActive(item.id);
          const showBadge = item.id === 'notifications' && unread > 0;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                width: '100%', padding: '10px 16px',
                background: active ? C.vertL : 'none',
                border: 'none', cursor: 'pointer', textAlign: 'left',
                borderLeft: active ? `3px solid ${C.vert}` : '3px solid transparent',
                transition: 'background .15s',
              }}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
              <span style={{
                fontSize: 13, fontWeight: active ? 700 : 500,
                color: active ? C.vert : C.txt, flex: 1,
              }}>
                {item.label}
              </span>
              {showBadge && (
                <span style={{
                  background: C.urg, color: C.blanc,
                  borderRadius: 10, padding: '1px 6px',
                  fontSize: 10, fontWeight: 700,
                }}>
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Déconnexion */}
      <div style={{ padding: '8px 12px 16px', flexShrink: 0 }}>
        <button
          onClick={onLogout}
          style={{
            width: '100%', padding: '10px 0',
            background: '#FEF2F2', color: C.urg,
            border: `1.5px solid #FECACA`, borderRadius: 10,
            fontWeight: 700, fontSize: 13, cursor: 'pointer',
          }}
        >
          🚪 Se déconnecter
        </button>
      </div>
    </div>
  );
}
