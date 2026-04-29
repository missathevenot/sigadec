import { C } from '../../constants/colors';
import Logo from '../ui/Logo';

export const TOP_BAR_HEIGHT = 72;

const PAGE_TITLES = {
  dashboard:          'Tableau de bord',
  'mon-espace':       'Mon Espace Personnel',
  diligences:         'Diligences',
  'diligence-detail': 'Détail Diligence',
  infos:              'Informations / Divers',
  rapports:           'Documentation',
  planning:           'Planning Annuel',
  courriers:          'Courriers',
  'courrier-detail':  'Détail Courrier',
  'emi-rec':          'Émissions / Recettes',
  notifications:      'Notifications',
  profile:            'Mon Profil',
  admin:              'Administration',
};

export default function TopBar({ page, unread = 0, onMenu, onBell, isMobile = true }) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      ...(isMobile ? { maxWidth: 430, margin: '0 auto' } : {}),
      height: TOP_BAR_HEIGHT,
      background: C.vertF,
      display: 'flex', alignItems: 'center',
      paddingInline: isMobile ? 14 : 24, gap: 10,
      zIndex: 50, boxShadow: '0 2px 8px rgba(0,0,0,.18)',
    }}>
      {isMobile && (
        <button onClick={onMenu} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: C.blanc, fontSize: 22, flexShrink: 0 }}>☰</button>
      )}

      <Logo size={isMobile ? 32 : 38} />

      {/* Nom + sous-titre */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, overflow: 'hidden' }}>
        <span style={{
          color: C.blanc, fontFamily: 'Nunito, sans-serif',
          fontWeight: 900, fontSize: isMobile ? 16 : 18,
          lineHeight: 1.1, whiteSpace: 'nowrap',
        }}>
          SIGADEC
        </span>
        <span style={{
          color: 'rgba(255,255,255,.65)',
          fontSize: isMobile ? 8 : 9.5,
          fontFamily: 'Inter, sans-serif',
          whiteSpace: 'nowrap',
          lineHeight: 1.2,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          Système Intégré de Gestion Administrative et Décisionnelle
        </span>
      </div>

      {/* Séparateur + page courante (desktop) */}
      {!isMobile && (
        <span style={{
          color: 'rgba(255,255,255,.5)',
          borderLeft: '1px solid rgba(255,255,255,.3)',
          paddingLeft: 12, marginLeft: 4,
          fontSize: 12, fontFamily: 'Inter, sans-serif',
          whiteSpace: 'nowrap',
        }}>
          Direction du Cadastre — DGI CI
        </span>
      )}

      <span style={{
        flex: 1, color: 'rgba(255,255,255,.85)', fontFamily: 'Inter, sans-serif',
        fontWeight: 600, fontSize: isMobile ? 13 : 14,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        textAlign: isMobile ? 'left' : 'right', paddingRight: isMobile ? 0 : 8,
      }}>
        {isMobile ? '' : (PAGE_TITLES[page] || 'SIGADEC')}
      </span>

      <button
        onClick={onBell}
        style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: C.blanc, fontSize: 22, flexShrink: 0 }}
      >
        🔔
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 0, right: 0,
            background: C.urg, color: C.blanc,
            borderRadius: '50%', width: 16, height: 16,
            fontSize: 9, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
    </div>
  );
}
