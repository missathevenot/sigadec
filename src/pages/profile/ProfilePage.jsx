import { C } from '../../constants/colors';
import { ROLES_LABELS } from '../../constants/roles';
import { SERVICES } from '../../constants/services';
import Av from '../../components/ui/Av';
import Card from '../../components/ui/Card';

export default function ProfilePage({ user }) {
  const svc = user.serviceId ? SERVICES.find(s => s.id === user.serviceId) : null;

  return (
    <div style={{ animation: 'pageIn .22s ease-out' }}>
      <div style={{
        background: `linear-gradient(135deg, ${C.vertF} 0%, ${C.vertM} 100%)`,
        padding: '40px 20px 60px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
      }}>
        <Av u={user} sz={72} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: C.blanc, fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: 20 }}>
            {user.prenom} {user.nom}
          </div>
          <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 13, marginTop: 4 }}>
            {ROLES_LABELS[user.role]}
          </div>
          {svc && (
            <div style={{ marginTop: 8, background: 'rgba(255,255,255,.2)', borderRadius: 12, padding: '4px 14px', display: 'inline-block', color: C.blanc, fontSize: 12 }}>
              {svc.abbr}
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '14px', marginTop: -20 }}>
        <Card>
          <Row label="Email" value={user.email} />
          <Row label="Fonction" value={ROLES_LABELS[user.role] || user.role} />
          <Row label="Statut" value={user.statut === 'actif' ? '✅ Actif' : '⏳ En attente'} />
          {svc && <Row label="Service" value={svc.nom} />}
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', paddingBlock: 10, borderBottom: `1px solid ${C.bord}` }}>
      <span style={{ fontSize: 11, color: C.sec, fontWeight: 600, marginBottom: 2 }}>{label}</span>
      <span style={{ fontSize: 14, color: C.txt }}>{value}</span>
    </div>
  );
}
