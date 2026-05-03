import { useState } from 'react';
import { C } from '../constants/colors';
import { ROLES_LABELS } from '../constants/roles';
import { SERVICES } from '../constants/services';
import { USERS } from '../constants/users';
import { INFO_STATUTS } from '../constants/statuts';
import { fmtDate } from '../utils/dates';
import { SEMAINE_COURANTE, MOIS_COURANT } from '../data/plannings';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Av from '../components/ui/Av';
import Modal from '../components/ui/Modal';
import { DilCardShared } from '../components/shared/DilCardShared';

function ActionBtn({ label, color, bg, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '5px 10px', borderRadius: 8, border: `1px solid ${color}`,
      background: bg, color, fontWeight: 700, fontSize: 11, cursor: 'pointer',
    }}>
      {label}
    </button>
  );
}

export default function Dashboard({ user, planningCharte, planningCR, diligences, rapports, chartes, courriers, notifications, infos, emissions, recettes, navigate }) {
  const [viewCharte, setViewCharte] = useState(false);
  const [viewCR, setViewCR]         = useState(false);

  const canAct       = user.role !== 'secretariat';
  const activeDils   = diligences.filter(d => ['en_cours','non_echu','reportee'].includes(d.statut));
  const urgentCours  = courriers.filter(c => c.sens === 'recu' && c.joursAttente > 10);
  const activeInfos  = infos.filter(i => ['actualite','urgent'].includes(i.statut));
  const unreadAlerts = notifications.filter(n => !n.lu);

  // Charte du mois — planning + document soumis
  const planCharte   = planningCharte?.[MOIS_COURANT];
  const svcCharte    = planCharte?.serviceId ? SERVICES.find(s => s.id === planCharte.serviceId) : null;
  const moisCharte   = chartes.find(c => c.mois === MOIS_COURANT && c.annee === new Date().getFullYear());

  // CR de la semaine — planning + document soumis
  const planCR       = planningCR?.[SEMAINE_COURANTE];
  const svcCR        = planCR?.serviceId ? SERVICES.find(s => s.id === planCR.serviceId) : null;
  const crSemaine    = rapports.find(r => r.type === 'Compte-rendu de réunion du comité' && r.semaine === SEMAINE_COURANTE);

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
        <MetricCard icon="◎" label="Diligences actives" value={activeDils.length} color={C.vert} bg={C.vertL} onClick={() => navigate('diligences')} />
        <MetricCard icon="🚨" label="Courriers urgents"  value={urgentCours.length} color={C.urg}  bg={C.urgB}  onClick={() => navigate('courriers')} />
        <MetricCard icon="⚖️" label="Chartes soumises"   value={chartes.length}     color={C.violet} bg={C.violetB} onClick={() => navigate('planning')} />
        <MetricCard icon="📋" label="Infos actives"      value={activeInfos.length} color={C.cours} bg={C.coursB} onClick={() => navigate('infos')} />
      </div>

      {/* Liste des diligences actives */}
      {activeDils.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.sec, marginBottom: 8 }}>
            DILIGENCES ACTIVES ({activeDils.length})
          </div>
          {activeDils.map(d => (
            <DilCardShared
              key={d.id}
              d={d}
              canAct={canAct}
              isAdmin={false}
              navigate={navigate}
              compact={true}
            />
          ))}
        </div>
      )}

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
        <div style={{ fontSize: 12, fontWeight: 700, color: C.sec, marginBottom: 8 }}>
          CHARTE ÉTHIQUE — MOIS EN COURS
        </div>
        <Card>
          {/* Service chargé */}
          {svcCharte && (
            <div style={{ fontSize: 12, color: C.vert, fontWeight: 700, marginBottom: 6, paddingBottom: 6, borderBottom: `1px solid ${C.bord}` }}>
              🏛️ Chargé : {svcCharte.abbr} — {svcCharte.nom.substring(0, 35)}…
            </div>
          )}
          {moisCharte ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.txt, marginBottom: 4 }}>{moisCharte.principe}</div>
              <div style={{ fontSize: 12, color: C.sec, marginBottom: 6 }}>{moisCharte.resume}</div>
              <div style={{ fontSize: 11, color: C.sec, marginBottom: 8 }}>{moisCharte.auteur} · {fmtDate(moisCharte.date)}</div>
              {canAct && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <ActionBtn label="👁 Afficher"  color={C.cours} bg={C.coursB} onClick={() => setViewCharte(true)} />
                  <ActionBtn label="✏️ Modifier"  color={C.vert}  bg={C.vertL}  onClick={() => navigate('planning')} />
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ fontSize: 13, color: C.sec, textAlign: 'center', padding: '10px 0', marginBottom: svcCharte ? 8 : 0 }}>
                ⚠️ Aucune charte soumise ce mois-ci
              </div>
              {canAct && svcCharte && (
                <ActionBtn label="✏️ Planifier / Modifier" color={C.vert} bg={C.vertL} onClick={() => navigate('planning')} />
              )}
            </>
          )}
        </Card>
      </div>

      {/* CR de la semaine */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.sec, marginBottom: 8 }}>
          COMPTE-RENDU — SEMAINE {SEMAINE_COURANTE}
        </div>
        <Card>
          {/* Service chargé */}
          {svcCR && (
            <div style={{ fontSize: 12, color: C.vert, fontWeight: 700, marginBottom: 6, paddingBottom: 6, borderBottom: `1px solid ${C.bord}` }}>
              🏛️ Chargé : {svcCR.abbr} — {svcCR.nom.substring(0, 35)}…
            </div>
          )}
          {planCR?.datePrevue && (
            <div style={{ fontSize: 11, color: C.sec, marginBottom: 4 }}>
              📅 Date prévue : {fmtDate(planCR.datePrevue)}
              {planCR.dateLecture && <span style={{ marginLeft: 8, color: C.cours }}>📖 Lecture : {fmtDate(planCR.dateLecture)}</span>}
            </div>
          )}
          {crSemaine ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.txt, marginBottom: 4 }}>{crSemaine.objet}</div>
              <div style={{ fontSize: 12, color: C.sec }}>{crSemaine.resume}</div>
              <div style={{ fontSize: 11, color: C.sec, marginTop: 4, marginBottom: 8 }}>{crSemaine.auteur} · {fmtDate(crSemaine.dateSubmission)}</div>
              {canAct && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <ActionBtn label="👁 Afficher"  color={C.cours} bg={C.coursB} onClick={() => setViewCR(true)} />
                  <ActionBtn label="✏️ Modifier"  color={C.vert}  bg={C.vertL}  onClick={() => navigate('planning')} />
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ fontSize: 13, color: C.sec, textAlign: 'center', padding: '10px 0', marginBottom: svcCR ? 8 : 0 }}>
                ⚠️ Aucun CR disponible cette semaine
              </div>
              {canAct && svcCR && (
                <ActionBtn label="✏️ Planifier / Modifier" color={C.vert} bg={C.vertL} onClick={() => navigate('planning')} />
              )}
            </>
          )}
        </Card>
      </div>

      {/* Modal view Charte */}
      {viewCharte && moisCharte && (
        <Modal title="Charte Éthique — détail" onClose={() => setViewCharte(false)}>
          {svcCharte && (
            <div style={{ fontSize: 13, color: C.vert, fontWeight: 700, marginBottom: 10 }}>
              {svcCharte.abbr} — {svcCharte.nom}
            </div>
          )}
          <div style={{ fontSize: 14, fontWeight: 700, color: C.txt, marginBottom: 8 }}>{moisCharte.principe}</div>
          {moisCharte.resume && (
            <div style={{ fontSize: 13, color: C.sec, lineHeight: 1.6, marginBottom: 8 }}>{moisCharte.resume}</div>
          )}
          <div style={{ fontSize: 11, color: C.sec }}>
            {moisCharte.auteur} · {fmtDate(moisCharte.date)}
          </div>
        </Modal>
      )}

      {/* Modal view CR */}
      {viewCR && crSemaine && (
        <Modal title={`CR CoDcad — Semaine ${SEMAINE_COURANTE}`} onClose={() => setViewCR(false)}>
          {svcCR && (
            <div style={{ fontSize: 13, color: C.vert, fontWeight: 700, marginBottom: 10 }}>
              {svcCR.abbr} — {svcCR.nom}
            </div>
          )}
          {planCR?.datePrevue && (
            <div style={{ fontSize: 12, color: C.sec, marginBottom: 4 }}>📅 Date prévue : {fmtDate(planCR.datePrevue)}</div>
          )}
          {planCR?.dateLecture && (
            <div style={{ fontSize: 12, color: C.cours, marginBottom: 10 }}>📖 Date de lecture : {fmtDate(planCR.dateLecture)}</div>
          )}
          <div style={{ fontSize: 14, fontWeight: 700, color: C.txt, marginBottom: 8 }}>{crSemaine.objet}</div>
          {crSemaine.resume && (
            <div style={{ fontSize: 13, color: C.sec, lineHeight: 1.6, marginBottom: 8 }}>{crSemaine.resume}</div>
          )}
          <div style={{ fontSize: 11, color: C.sec }}>
            {crSemaine.auteur} · {fmtDate(crSemaine.dateSubmission)}
          </div>
        </Modal>
      )}
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
