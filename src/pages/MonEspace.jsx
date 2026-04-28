import { C } from '../constants/colors';
import { ROLES_LABELS } from '../constants/roles';
import { SERVICES } from '../constants/services';
import { DIL_STATUTS, INFO_STATUTS } from '../constants/statuts';
import { fmtDate } from '../utils/dates';
import { MOIS_COURANT } from '../data/plannings';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Av from '../components/ui/Av';
import PBar from '../components/ui/PBar';
import EmptyState from '../components/ui/EmptyState';

export default function MonEspace({ user, diligences, infos, rapports, chartes, emissions, recettes, navigate }) {
  const myDils     = diligences.filter(d => d.assigneA === user.id && !['supprimee','executee'].includes(d.statut));
  const activeInfos = infos.filter(i => ['actualite','urgent'].includes(i.statut)).slice(0, 3);
  const lastEmi    = emissions.slice(0, 2);
  const lastRec    = recettes.slice(0, 2);
  const moisCharte = chartes.find(c => c.mois === MOIS_COURANT && c.annee === new Date().getFullYear());
  const myChartes  = chartes.filter(c => {
    const svc = SERVICES.find(s => s.id === c.serviceId);
    return svc?.chefId === user.id || c.auteur === `${user.prenom} ${user.nom}`;
  });
  const myDocs = rapports.filter(r => r.serviceId === user.serviceId || r.auteur === `${user.prenom} ${user.nom}`).slice(0, 3);

  const svc = user.serviceId ? SERVICES.find(s => s.id === user.serviceId) : null;

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
          {svc && <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 11, marginTop: 2 }}>{svc.abbr}</div>}
        </div>
      </div>

      {/* Mes diligences */}
      {user.role !== 'secretariat' && (
        <Section title="Mes Diligences" count={myDils.length} onMore={() => navigate('diligences')}>
          {myDils.length === 0
            ? <EmptyState icon="◎" title="Aucune diligence active" />
            : myDils.slice(0, 3).map(d => {
                const st = DIL_STATUTS.find(s => s.v === d.statut);
                return (
                  <Card key={d.id} style={{ marginBottom: 8, cursor: 'pointer' }} onClick={() => navigate('diligence-detail', { id: d.id })}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: C.sec, fontFamily: 'monospace' }}>{d.reference}</span>
                      {st && <Badge l={st.l} bg={st.bg} c={st.c} />}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.txt, marginBottom: 6 }}>{d.intitule}</div>
                    <PBar v={d.progression} />
                    <div style={{ fontSize: 11, color: C.sec, marginTop: 4 }}>📅 {fmtDate(d.echeance)}</div>
                  </Card>
                );
              })
          }
        </Section>
      )}

      {/* Infos actives */}
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

      {/* Charte du mois */}
      <Section title="Charte du mois" count={null}>
        <Card>
          {moisCharte
            ? <>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.txt, marginBottom: 4 }}>{moisCharte.principe}</div>
                <div style={{ fontSize: 12, color: C.sec }}>{moisCharte.resume}</div>
              </>
            : <div style={{ fontSize: 13, color: C.sec, textAlign: 'center', padding: '8px 0' }}>⚠️ Aucune charte ce mois</div>
          }
        </Card>
      </Section>

      {/* Mes chartes */}
      {myChartes.length > 0 && user.role !== 'secretariat' && (
        <Section title="Mes Chartes" count={myChartes.length} onMore={() => navigate('chartes')}>
          {myChartes.slice(0, 2).map(c => (
            <Card key={c.id} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.txt, marginBottom: 2 }}>{c.principe}</div>
              <div style={{ fontSize: 11, color: C.sec }}>{SERVICES.find(s => s.id === c.serviceId)?.abbr} · {fmtDate(c.date)}</div>
            </Card>
          ))}
        </Section>
      )}

      {/* Mes documents */}
      {myDocs.length > 0 && (
        <Section title="Mes Documents" count={myDocs.length} onMore={() => navigate('rapports')}>
          {myDocs.map(r => (
            <Card key={r.id} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.txt, marginBottom: 2 }}>{r.objet || r.titre}</div>
              <div style={{ fontSize: 11, color: C.sec }}>{r.type} · {fmtDate(r.dateSubmission)}</div>
            </Card>
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ title, count, onMore, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.sec }}>
          {title.toUpperCase()} {count !== null && `(${count})`}
        </div>
        {onMore && <span onClick={onMore} style={{ fontSize: 12, color: C.vert, fontWeight: 700, cursor: 'pointer' }}>Voir tout →</span>}
      </div>
      {children}
    </div>
  );
}
