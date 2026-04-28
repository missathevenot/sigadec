import { C } from '../constants/colors';
import { ROLES_LABELS } from '../constants/roles';
import { SERVICES } from '../constants/services';
import { USERS } from '../constants/users';
import { DIL_STATUTS, INFO_STATUTS } from '../constants/statuts';
import { fmtDate } from '../utils/dates';
import { SEMAINE_COURANTE, MOIS_COURANT } from '../data/plannings';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Av from '../components/ui/Av';
import PBar from '../components/ui/PBar';

export default function Dashboard({ user, diligences, rapports, chartes, courriers, notifications, infos, navigate }) {
  const myDils = diligences.filter(d => d.assigneA === user.id && !['supprimee','executee'].includes(d.statut));
  const urgentCours = courriers.filter(c => c.sens === 'recu' && c.joursAttente > 10);
  const chartesCount = chartes.length;
  const activeInfos = infos.filter(i => ['actualite','urgent'].includes(i.statut));
  const unreadAlerts = notifications.filter(n => !n.lu);

  const moisCharte = chartes.find(c => c.mois === MOIS_COURANT && c.annee === new Date().getFullYear());
  const crSemaine  = rapports.find(r => r.type === 'Compte-rendu de réunion du comité' && r.semaine === SEMAINE_COURANTE);

  const svc = user.serviceId ? SERVICES.find(s => s.id === user.serviceId) : null;

  return (
    <div style={{ padding: '14px 14px 0', animation: 'pageIn .22s ease-out' }}>
      {/* Bannière utilisateur */}
      <div style={{
        background: `linear-gradient(135deg, ${C.vertF} 0%, ${C.vertM} 100%)`,
        borderRadius: 16, padding: '18px 16px', marginBottom: 16,
        display: 'flex', gap: 12, alignItems: 'center',
      }}>
        <Av u={user} sz={48} />
        <div>
          <div style={{ color: C.blanc, fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 15 }}>
            {user.prenom} {user.nom}
          </div>
          <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 11, marginTop: 2 }}>{ROLES_LABELS[user.role]}</div>
          {svc && <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 10, marginTop: 2 }}>{svc.abbr}</div>}
        </div>
      </div>

      {/* Rappels quotidiens */}
      {unreadAlerts.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.sec, marginBottom: 8 }}>RAPPELS DU JOUR</div>
          {unreadAlerts.slice(0, 3).map(a => (
            <div key={a.id} style={{
              background: a.type === 'overdue' ? C.urgB : C.orngL,
              borderRadius: 10, padding: '10px 12px', marginBottom: 6,
              fontSize: 12, color: a.type === 'overdue' ? C.urg : C.orng,
              borderLeft: `3px solid ${a.type === 'overdue' ? C.urg : C.orng}`,
            }}>
              {a.message}
            </div>
          ))}
        </div>
      )}

      {/* Grille métriques 2×2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <MetricCard icon="◎" label="Mes Diligences" value={myDils.length} color={C.vert} bg={C.vertL} onClick={() => navigate('diligences')} />
        <MetricCard icon="🚨" label="Courriers urgents" value={urgentCours.length} color={C.urg} bg={C.urgB} onClick={() => navigate('courriers')} />
        <MetricCard icon="⚖️" label="Chartes soumises" value={chartesCount} color={C.violet} bg={C.violetB} onClick={() => navigate('chartes')} />
        <MetricCard icon="📋" label="Infos actives" value={activeInfos.length} color={C.cours} bg={C.coursB} onClick={() => navigate('infos')} />
      </div>

      {/* Infos actives */}
      {activeInfos.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.sec, marginBottom: 8 }}>INFORMATIONS ACTIVES</div>
          {activeInfos.map(inf => {
            const st = INFO_STATUTS.find(s => s.v === inf.statut);
            return (
              <Card key={inf.id} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.txt, flex: 1, paddingRight: 8 }}>{inf.titre}</div>
                  {st && <Badge l={st.l} bg={st.bg} c={st.c} />}
                </div>
                <div style={{ fontSize: 11, color: C.sec }}>{fmtDate(inf.dateSubmission)}</div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Charte du mois */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.sec, marginBottom: 8 }}>CHARTE ÉTHIQUE — MOIS EN COURS</div>
        <Card>
          {moisCharte ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.txt, marginBottom: 4 }}>{moisCharte.principe}</div>
              <div style={{ fontSize: 12, color: C.sec, marginBottom: 6 }}>{moisCharte.resume}</div>
              <div style={{ fontSize: 11, color: C.sec }}>{moisCharte.auteur} · {fmtDate(moisCharte.date)}</div>
            </>
          ) : (
            <div style={{ fontSize: 13, color: C.sec, textAlign: 'center', padding: '10px 0' }}>⚠️ Aucune charte soumise ce mois-ci</div>
          )}
        </Card>
      </div>

      {/* CR de la semaine */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.sec, marginBottom: 8 }}>COMPTE-RENDU — SEMAINE {SEMAINE_COURANTE}</div>
        <Card>
          {crSemaine ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.txt, marginBottom: 4 }}>{crSemaine.objet}</div>
              <div style={{ fontSize: 12, color: C.sec }}>{crSemaine.resume}</div>
              <div style={{ fontSize: 11, color: C.sec, marginTop: 4 }}>{crSemaine.auteur} · {fmtDate(crSemaine.dateSubmission)}</div>
            </>
          ) : (
            <div style={{ fontSize: 13, color: C.sec, textAlign: 'center', padding: '10px 0' }}>⚠️ Aucun CR disponible cette semaine</div>
          )}
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, color, bg, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: bg, borderRadius: 14, padding: '14px 14px',
      cursor: 'pointer', boxShadow: '0 1px 6px rgba(0,0,0,.05)',
    }}>
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 26, fontWeight: 900, fontFamily: 'Nunito, sans-serif', color }}>{value}</div>
      <div style={{ fontSize: 11, color, fontWeight: 600, marginTop: 2 }}>{label}</div>
    </div>
  );
}
