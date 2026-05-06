import { C } from '../../constants/colors';
import { ROLES_LABELS } from '../../constants/roles';
import { SERVICES } from '../../constants/services';
import Av from '../ui/Av';
import { canReadEmiRec } from '../../utils/access';

const MENU_ITEMS = [
  { id: 'dashboard',  icon: '🏠', label: 'Tableau de bord' },
  { id: 'mon-espace', icon: '👤', label: 'Mon Espace' },
  { id: 'diligences', icon: '◎',  label: 'Diligences', hideFor: ['secretariat'] },
  { id: 'infos',      icon: '📋', label: 'Informations / Divers' },
  { id: 'rapports',   icon: '📄', label: 'Documentation' },
  { id: 'planning',   icon: '📅', label: 'Planning Annuel', hideFor: ['secretariat'] },
  { id: 'courriers',  icon: '✉️',  label: 'Courriers',            strictAdmin: true },
  { id: 'emi-rec',    icon: '💰', label: 'Émissions / Recettes', emiRec: true },
  { id: 'notifications', icon: '🔔', label: 'Notifications' },
  { id: 'profile',    icon: '🪪',  label: 'Mon Profil' },
  { id: 'admin',      icon: '🛡️',  label: 'Administration', adminOnly: true },
];

export default function AppDrawer({ open, user, navigate, onClose, onLogout, currentPage, onInstall }) {
  if (!open) return null;

  const svc = user?.serviceId ? SERVICES.find(s => s.id === user.serviceId) : null;

  const items = MENU_ITEMS.filter(item => {
    if (item.hideFor?.includes(user?.role)) return false;
    if (item.adminOnly && !['admin','directeur'].includes(user?.role)) return false;
    if (item.strictAdmin && user?.role !== 'admin') return false;
    if (item.emiRec && !canReadEmiRec(user)) return false;
    return true;
  });

  const go = (id) => { navigate(id); onClose(); };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, bottom: 0,
      width: '82%', maxWidth: 340,
      background: C.blanc, zIndex: 60,
      display: 'flex', flexDirection: 'column',
      boxShadow: '4px 0 24px rgba(0,0,0,.18)',
      overflowY: 'auto',
    }}>
      <div style={{
        background: `linear-gradient(135deg, ${C.vertF} 0%, ${C.vert} 100%)`,
        padding: '40px 20px 24px',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        <Av u={user} sz={60} />
        <div>
          <div style={{ color: C.blanc, fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 17 }}>
            {user?.prenom} {user?.nom}
          </div>
          <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 12, marginTop: 2 }}>
            {ROLES_LABELS[user?.role] || user?.role}
          </div>
          {svc && (
            <div style={{
              marginTop: 6, background: 'rgba(255,255,255,.18)', borderRadius: 10,
              padding: '3px 10px', fontSize: 11, color: C.blanc, display: 'inline-block',
            }}>
              {svc.abbr}
            </div>
          )}
        </div>
      </div>

      <nav style={{ flex: 1, padding: '10px 0' }}>
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => go(item.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              width: '100%', padding: '13px 20px',
              background: currentPage === item.id ? C.vertL : 'none',
              border: 'none', cursor: 'pointer', textAlign: 'left',
              borderLeft: currentPage === item.id ? `3px solid ${C.vert}` : '3px solid transparent',
            }}
          >
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <span style={{
              fontSize: 14, fontWeight: 600,
              color: currentPage === item.id ? C.vert : C.txt,
            }}>
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      <div style={{ margin: '10px 16px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <a
          href="Manuel_Utilisateur_SIGADEC.pdf"
          download="Manuel_Utilisateur_SIGADEC.pdf"
          style={{
            display: 'block', padding: '11px 0',
            background: C.coursB, color: C.cours,
            border: `1.5px solid ${C.cours}`, borderRadius: 10,
            fontWeight: 700, fontSize: 14, cursor: 'pointer',
            textAlign: 'center', textDecoration: 'none',
          }}
        >
          📥 Télécharger le manuel
        </a>

        {/* Bouton d'installation PWA — visible uniquement si le navigateur propose l'installation */}
        {onInstall && (
          <button
            onClick={onInstall}
            style={{
              padding: '11px 0',
              background: `linear-gradient(135deg, ${C.vertF} 0%, ${C.vert} 100%)`,
              color: C.blanc,
              border: 'none', borderRadius: 10,
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: `0 2px 8px ${C.vert}50`,
            }}
          >
            <img
              src="icon-192.png"
              alt="SIGADEC"
              style={{ width: 22, height: 22, borderRadius: 5, objectFit: 'contain' }}
            />
            📲 Installer version mobile
          </button>
        )}

        <button
          onClick={() => { onLogout(); onClose(); }}
          style={{
            padding: '11px 0',
            background: '#FEF2F2', color: C.urg,
            border: `1.5px solid #FECACA`, borderRadius: 10,
            fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}
        >
          🚪 Se déconnecter
        </button>
      </div>
    </div>
  );
}
