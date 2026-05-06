import { useState } from 'react';
import { C } from '../constants/colors';
import { ROLES_LABELS } from '../constants/roles';
import { SERVICES } from '../constants/services';
import { INFO_STATUTS } from '../constants/statuts';
import { getUserImputeIds } from '../constants/imputation';
import { fmtDate } from '../utils/dates';
import { MOIS_COURANT, SEMAINE_COURANTE } from '../data/plannings';
import { MOIS_NOMS } from '../constants/mois';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Av from '../components/ui/Av';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import { DilCardShared } from '../components/shared/DilCardShared';

const STATUT_ORDER = { en_cours: 0, non_echu: 1, reportee: 2, executee: 3, supprimee: 4 };

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

export default function MonEspace({ user, planningCharte, planningCR, diligences, infos, rapports, chartes, emissions, recettes, navigate }) {
  const [viewCharte, setViewCharte] = useState(null); // charte object
  const [viewCR, setViewCR]         = useState(null); // planningCR entry

  const canAct = user.role !== 'secretariat';
  const svc    = user.serviceId ? SERVICES.find(s => s.id === user.serviceId) : null;

  // ── Diligences imputées à cet utilisateur ──
  const imputeIds   = getUserImputeIds(user);
  const imputedDils = diligences
    .filter(d =>
      Array.isArray(d.imputeA) && d.imputeA.some(v => imputeIds.includes(v))
    )
    .sort((a, b) => (STATUT_ORDER[a.statut] ?? 5) - (STATUT_ORDER[b.statut] ?? 5));

  // ── Chartes imputées à ce service ──
  const myCharteEntries = Object.entries(planningCharte || {})
    .map(([m, e]) => ({ moisNum: parseInt(m), moisNom: MOIS_NOMS[parseInt(m) - 1], ...e }))
    .filter(e => e.serviceId === user.serviceId);

  const mySubmittedChartes = chartes.filter(c => c.serviceId === user.serviceId);

  // ── CR imputés à ce service ──
  const myCREntries = Object.entries(planningCR || {})
    .map(([w, e]) => ({ w: parseInt(w), ...e }))
    .filter(e => e.serviceId === user.serviceId && e.datePrevue)
    .sort((a, b) => a.w - b.w);

  // Prochain CR à venir
  const upcomingCR = myCREntries.filter(e => e.w >= SEMAINE_COURANTE);

  // Infos actives (général)
  const activeInfos = infos.filter(i => ['actualite','urgent'].includes(i.statut)).slice(0, 3);

  return (
    <div style={{ padding: '14px 14px 0', animation: 'pageIn .22s ease-out' }}>
      {/* Bannière utilisateur */}
      <div style={{
        background: `linear-gradient(135deg, ${C.vertF} 0%, ${C.vertM} 100%)`,
        borderRadius: 16, padding: '18px 16px', marginBottom: 16,
        display: 'flex', gap: 12, alignItems: 'center',
      }}>
        <Av u={user} sz={52} />
        <div>
          <div style={{ color: C.blanc, fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 16 }}>
            {user.prenom} {user.nom}
          </div>
          <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 12, marginTop: 2 }}>{ROLES_LABELS[user.role]}</div>
          {svc
            ? <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 11, marginTop: 2 }}>{svc.abbr}</div>
            : imputeIds.length > 0 && <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 11, marginTop: 2 }}>{imputeIds[0]}</div>
          }
        </div>
      </div>

      {/* ── Mes Diligences imputées ── */}
      {canAct && (
        <Section title="Mes Diligences" count={imputedDils.length} onMore={() => navigate('diligences')}>
          {imputedDils.length === 0
            ? <EmptyState icon="◎" title="Aucune diligence imputée" />
            : imputedDils.map(d => (
                <DilCardShared
                  key={d.id}
                  d={d}
                  canAct={canAct}
                  isAdmin={false}
                  navigate={navigate}
                  compact={true}
                />
              ))
          }
        </Section>
      )}

      {/* ── Infos actives ── */}
      {activeInfos.length > 0 && (
        <Section title="Infos actives" count={activeInfos.length} onMore={() => navigate('infos')}>
          {activeInfos.map(inf => {
            const st = INFO_STATUTS.find(s => s.v === inf.statut);
            return (
              <Card key={inf.id} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.txt, flex: 1, paddingRight: 8 }}>{inf.titre}</span>
                  {st && <Badge l={st.l} bg={st.bg} c={st.c} />}
                </div>
                <div style={{ fontSize: 11, color: C.sec }}>{fmtDate(inf.dateSubmission)}</div>
              </Card>
            );
          })}
        </Section>
      )}

      {/* ── Charte Éthique de mon service ── */}
      {canAct && user.serviceId && (
        <Section title="Charte Éthique — Mon service" count={null}>
          {myCharteEntries.length === 0 && mySubmittedChartes.length === 0 ? (
            <Card>
              <div style={{ fontSize: 13, color: C.sec, textAlign: 'center', padding: '8px 0' }}>
                ⚠️ Aucune charte planifiée pour ce service
              </div>
            </Card>
          ) : (
            <>
              {/* Planning assignments */}
              {myCharteEntries.map(entry => {
                const submitted = mySubmittedChartes.find(c => c.mois === entry.moisNum);
                return (
                  <Card key={entry.moisNum} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: C.txt }}>{entry.moisNom} {new Date().getFullYear()}</div>
                        {entry.principe && (
                          <div style={{ fontSize: 11, color: C.sec, marginTop: 2, fontStyle: 'italic' }}>⚖️ {entry.principe}</div>
                        )}
                        {entry.dateSoumis && (
                          <div style={{ fontSize: 11, color: C.sec, marginTop: 2 }}>📅 {fmtDate(entry.dateSoumis)}</div>
                        )}
                      </div>
                      {submitted
                        ? <span style={{ fontSize: 10, color: C.ok, fontWeight: 700 }}>✅ Déposé</span>
                        : <span style={{ fontSize: 10, color: C.orng, fontWeight: 700 }}>⏳ En attente</span>
                      }
                    </div>
                    {submitted && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: C.txt, marginBottom: 2 }}>{submitted.principe}</div>
                        {submitted.resume && <div style={{ fontSize: 11, color: C.sec }}>{submitted.resume}</div>}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <ActionBtn label="👁 Afficher"  color={C.cours} bg={C.coursB}
                        onClick={() => setViewCharte(submitted || entry)} />
                      <ActionBtn label="✏️ Modifier"  color={C.vert}  bg={C.vertL}
                        onClick={() => navigate('planning')} />
                    </div>
                  </Card>
                );
              })}
            </>
          )}
        </Section>
      )}

      {/* ── Compte-Rendus de mon service ── */}
      {canAct && user.serviceId && myCREntries.length > 0 && (
        <Section title="Comptes-Rendus — Mon service" count={upcomingCR.length > 0 ? upcomingCR.length : null}>
          {(upcomingCR.length > 0 ? upcomingCR : myCREntries).slice(0, 3).map(entry => (
            <Card key={entry.w} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: entry.w === SEMAINE_COURANTE ? C.vert : C.txt }}>
                    {entry.w === SEMAINE_COURANTE ? '▶ ' : ''}Semaine {entry.w}
                  </div>
                  {entry.datePrevue && (
                    <div style={{ fontSize: 11, color: C.sec, marginTop: 2 }}>📅 Date prévue : {fmtDate(entry.datePrevue)}</div>
                  )}
                  {entry.dateLecture && (
                    <div style={{ fontSize: 11, color: C.cours, marginTop: 2 }}>📖 Date de lecture : {fmtDate(entry.dateLecture)}</div>
                  )}
                </div>
                {entry.w === SEMAINE_COURANTE && (
                  <span style={{ fontSize: 9, background: C.vert, color: C.blanc, borderRadius: 6, padding: '1px 6px', fontWeight: 700 }}>
                    ACTUELLE
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <ActionBtn label="👁 Afficher"  color={C.cours} bg={C.coursB}
                  onClick={() => setViewCR(entry)} />
                <ActionBtn label="✏️ Modifier"  color={C.vert}  bg={C.vertL}
                  onClick={() => navigate('planning')} />
              </div>
            </Card>
          ))}
        </Section>
      )}

      {/* ── Modal Afficher Charte ── */}
      {viewCharte && (
        <Modal title="Charte Éthique — Détail" onClose={() => setViewCharte(null)}>
          {viewCharte.moisNum && (
            <div style={{ fontSize: 13, fontWeight: 700, color: C.txt, marginBottom: 6 }}>
              {MOIS_NOMS[viewCharte.moisNum - 1]} {new Date().getFullYear()}
            </div>
          )}
          {svc && (
            <div style={{ fontSize: 12, color: C.vert, fontWeight: 700, marginBottom: 8 }}>
              {svc.abbr} — {svc.nom}
            </div>
          )}
          {(viewCharte.principe) && (
            <div style={{ fontSize: 13, fontWeight: 700, color: C.txt, marginBottom: 6 }}>⚖️ {viewCharte.principe}</div>
          )}
          {viewCharte.resume && (
            <div style={{ fontSize: 12, color: C.sec, lineHeight: 1.6, marginBottom: 8 }}>{viewCharte.resume}</div>
          )}
          {viewCharte.auteur && (
            <div style={{ fontSize: 11, color: C.sec }}>
              {viewCharte.auteur} · {fmtDate(viewCharte.date || viewCharte.dateSoumis)}
            </div>
          )}
          {!viewCharte.auteur && viewCharte.dateSoumis && (
            <div style={{ fontSize: 11, color: C.sec }}>📅 {fmtDate(viewCharte.dateSoumis)}</div>
          )}
        </Modal>
      )}

      {/* ── Modal Afficher CR ── */}
      {viewCR && (
        <Modal title={`CR CoDcad — Semaine ${viewCR.w}`} onClose={() => setViewCR(null)}>
          {svc && (
            <div style={{ fontSize: 12, color: C.vert, fontWeight: 700, marginBottom: 8 }}>
              {svc.abbr} — {svc.nom}
            </div>
          )}
          {viewCR.datePrevue && (
            <div style={{ fontSize: 13, color: C.txt, marginBottom: 6 }}>
              📅 Date prévue : <strong>{fmtDate(viewCR.datePrevue)}</strong>
            </div>
          )}
          {viewCR.dateLecture && (
            <div style={{ fontSize: 13, color: C.cours, marginBottom: 6 }}>
              📖 Date de lecture : <strong>{fmtDate(viewCR.dateLecture)}</strong>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

function Section({ title, count, onMore, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.sec }}>
          {title.toUpperCase()} {count !== null && count !== undefined && `(${count})`}
        </div>
        {onMore && <span onClick={onMore} style={{ fontSize: 12, color: C.vert, fontWeight: 700, cursor: 'pointer' }}>Voir tout →</span>}
      </div>
      {children}
    </div>
  );
}
