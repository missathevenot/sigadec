import { useState } from 'react';
import { C } from '../../constants/colors';
import { SERVICES } from '../../constants/services';
import { MOIS_NOMS } from '../../constants/mois';
import { PRINCIPES_VALEURS } from '../../constants/principes';
import { fmtDate, today } from '../../utils/dates';
import { isoWeek } from '../../utils/refs';
import { supabase } from '../../lib/supabase';
import Card from '../../components/ui/Card';
import Btn from '../../components/ui/Btn';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';

const ROLES_PLANIF = ['admin', 'directeur', 'conseiller_tech', 'sous_directeur'];

const SEMAINE_COURANTE = isoWeek(new Date());
const ANNEE_COURANTE   = new Date().getFullYear();

// Dernière semaine ISO de l'année (calculée via Dec 28 qui est toujours dans la dernière semaine)
function lastIsoWeekOfYear(year) {
  return isoWeek(new Date(year, 11, 28));
}

export default function PlanningPage({ user, planningCharte, setPlanningCharte, planningCR, setPlanningCR, rapports }) {
  const [onglet, setOnglet]       = useState('charte');
  const [modalCharte, setMCharte] = useState(false);
  const [modalCR, setMCR]         = useState(false);

  const canPlan = ROLES_PLANIF.includes(user.role);
  const MOIS_COURANT = new Date().getMonth() + 1;

  // Fenêtre CR : semaines n-5 à n+10
  const sMin = Math.max(1, SEMAINE_COURANTE - 5);
  const sMax = Math.min(lastIsoWeekOfYear(ANNEE_COURANTE), SEMAINE_COURANTE + 10);

  const crEntries = Object.entries(planningCR)
    .map(([w, e]) => ({ w: parseInt(w), ...e }))
    .filter(e => e.w >= sMin && e.w <= sMax)
    .sort((a, b) => a.w - b.w);

  // Vérifier si un commentaire charte a été déposé pour un mois/service
  const charteDeposee = (moisNum, serviceId) =>
    (rapports || []).some(r =>
      r.type === "Commentaire de la Charte d'Ethique" &&
      r.moisDoc === moisNum &&
      r.serviceId === serviceId
    );

  return (
    <div style={{ padding: '14px 14px 0', animation: 'pageIn .22s ease-out' }}>
      {/* Onglets */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {[{ v:'charte', l:'Charte Éthique' }, { v:'cr', l:'Comptes Rendus' }].map(t => (
          <button key={t.v} onClick={() => setOnglet(t.v)} style={{
            flex: 1, padding: '9px 0', borderRadius: 10, fontWeight: 700, fontSize: 13,
            border: `2px solid ${onglet === t.v ? C.vert : C.bord}`,
            background: onglet === t.v ? C.vertL : C.blanc,
            color: onglet === t.v ? C.vert : C.sec, cursor: 'pointer',
          }}>
            {t.l}
          </button>
        ))}
      </div>

      {/* ── Onglet Charte Éthique ── */}
      {onglet === 'charte' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 14, color: C.txt }}>
              Planning Charte Éthique — {ANNEE_COURANTE}
            </div>
            {canPlan && (
              <Btn size="sm" onClick={() => setMCharte(true)}>+ Planifier</Btn>
            )}
          </div>

          {Object.entries(planningCharte)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([m, entry]) => {
              const moisNum = parseInt(m);
              const svc      = SERVICES.find(s => s.id === entry.serviceId);
              const isCurrent = moisNum === MOIS_COURANT;
              const soumis    = charteDeposee(moisNum, entry.serviceId);
              return (
                <Card key={m} style={{
                  marginBottom: 8,
                  borderLeft: isCurrent ? `3px solid ${C.vert}` : `3px solid transparent`,
                  background: isCurrent ? C.vertL : C.blanc,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{ fontWeight: 800, fontSize: 14, color: C.txt }}>{entry.mois}</span>
                        {isCurrent && (
                          <span style={{ fontSize: 9, background: C.vert, color: C.blanc, borderRadius: 6, padding: '1px 6px', fontWeight: 700 }}>
                            EN COURS
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: C.vert, fontWeight: 700 }}>{svc?.abbr || '—'} — {svc?.nom?.substring(0, 28) || ''}</div>
                      {entry.principe && (
                        <div style={{ fontSize: 11, color: C.sec, marginTop: 4, fontStyle: 'italic', lineHeight: 1.4 }}>
                          ⚖️ {entry.principe}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {soumis
                        ? <div style={{ color: C.ok, fontWeight: 700, fontSize: 11 }}>✅ Déposé</div>
                        : <div style={{ color: C.orng, fontWeight: 700, fontSize: 11 }}>⏳ En attente</div>
                      }
                    </div>
                  </div>
                </Card>
              );
            })}
        </div>
      )}

      {/* ── Onglet Comptes Rendus ── */}
      {onglet === 'cr' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 14, color: C.txt }}>
              Planning CR CoDcad — Semaines {sMin} à {sMax}
            </div>
            {canPlan && (
              <Btn size="sm" onClick={() => setMCR(true)}>+ Planifier</Btn>
            )}
          </div>

          {crEntries.length === 0 && (
            <div style={{ textAlign: 'center', color: C.sec, fontSize: 13, paddingTop: 24 }}>Aucune semaine à afficher.</div>
          )}

          {crEntries.map(({ w, serviceId, datePrevue }) => {
            const svc       = SERVICES.find(s => s.id === serviceId);
            const isCurrent = w === SEMAINE_COURANTE;
            // Vérifier si un CR a été déposé pour cette semaine
            const crDepose = (rapports || []).some(r =>
              r.type === 'Compte-rendu de réunion du comité' && r.semaine === w
            );
            return (
              <div key={w} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', borderRadius: 10, marginBottom: 6,
                background: isCurrent ? C.vertL : C.blanc,
                border: isCurrent ? `1.5px solid ${C.vert}` : `1px solid ${C.bord}`,
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: isCurrent ? 800 : 600, color: isCurrent ? C.vert : C.txt }}>
                      {isCurrent ? '▶ ' : ''}Semaine {w}
                    </span>
                    {isCurrent && (
                      <span style={{ fontSize: 9, background: C.vert, color: C.blanc, borderRadius: 6, padding: '1px 6px', fontWeight: 700 }}>
                        ACTUELLE
                      </span>
                    )}
                  </div>
                  {datePrevue && (
                    <div style={{ fontSize: 11, color: C.sec, marginTop: 2 }}>{fmtDate(datePrevue)}</div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: C.vert, fontWeight: 700 }}>{svc?.abbr || '—'}</div>
                  {crDepose
                    ? <div style={{ fontSize: 10, color: C.ok, fontWeight: 600 }}>✅ Déposé</div>
                    : <div style={{ fontSize: 10, color: C.sec }}>⏳ En attente</div>
                  }
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {modalCharte && (
        <PlanifierCharteModal
          planningCharte={planningCharte}
          setPlanningCharte={setPlanningCharte}
          user={user}
          onClose={() => setMCharte(false)}
        />
      )}
      {modalCR && (
        <PlanifierCRModal
          planningCR={planningCR}
          setPlanningCR={setPlanningCR}
          user={user}
          onClose={() => setMCR(false)}
        />
      )}
    </div>
  );
}

/* ── Modal : Planifier une Charte d'Ethique ── */
function PlanifierCharteModal({ planningCharte, setPlanningCharte, user, onClose }) {
  const [mois, setMois]         = useState('');
  const [serviceId, setSvc]     = useState('');
  const [principe, setPrincipe] = useState('');
  const [datePrevue, setDate]   = useState(today());
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState('');

  const moisOpts     = MOIS_NOMS.map((m, i) => ({ value: String(i + 1), label: m }));
  const svcOpts      = SERVICES.map(s => ({ value: s.id, label: `${s.abbr} — ${s.nom.substring(0, 28)}…` }));
  const principeOpts = PRINCIPES_VALEURS.map(p => ({ value: p, label: p }));

  const submit = async () => {
    if (!mois || !serviceId || !principe) { setErr('Mois, service et principe sont requis.'); return; }
    setSaving(true);
    const moisNum = parseInt(mois);
    const moisNom = MOIS_NOMS[moisNum - 1];

    await supabase.from('planning_charte')
      .update({ service_id: serviceId, principe, date_soumis: datePrevue })
      .eq('mois', moisNum);

    setPlanningCharte(p => ({
      ...p,
      [moisNum]: { ...p[moisNum], serviceId, principe, mois: moisNom },
    }));
    setSaving(false);
    onClose();
  };

  return (
    <Modal title="Planifier une Charte d'Ethique" onClose={onClose}>
      <Select label="Mois" value={mois} onChange={setMois} options={moisOpts} required placeholder="Choisir un mois…" />
      <Select label="Service" value={serviceId} onChange={setSvc} options={svcOpts} required placeholder="Choisir un service…" />
      <Select label="Principes et valeurs" value={principe} onChange={setPrincipe} options={principeOpts} required placeholder="Choisir un principe…" />
      <Input label="Date prévue" value={datePrevue} onChange={setDate} type="date" />
      {err && <div style={{ color: C.urg, fontSize: 12, marginBottom: 10 }}>{err}</div>}
      <Btn onClick={submit} full disabled={saving}>{saving ? 'Enregistrement…' : 'Planifier'}</Btn>
    </Modal>
  );
}

/* ── Modal : Planifier un CR de réunion CoDcad ── */
function PlanifierCRModal({ planningCR, setPlanningCR, user, onClose }) {
  const lastWeek  = lastIsoWeekOfYear(ANNEE_COURANTE);
  const [semaine, setSemaine] = useState(String(SEMAINE_COURANTE));
  const [serviceId, setSvc]   = useState('');
  const [datePrevue, setDate] = useState(today());
  const [saving, setSaving]   = useState(false);
  const [err, setErr]         = useState('');

  const semaineOpts = Array.from({ length: lastWeek }, (_, i) => ({
    value: String(i + 1),
    label: `Semaine ${i + 1}${i + 1 === SEMAINE_COURANTE ? ' (actuelle)' : ''}`,
  }));
  const svcOpts = SERVICES.map(s => ({ value: s.id, label: `${s.abbr} — ${s.nom.substring(0, 28)}…` }));

  const submit = async () => {
    if (!semaine || !serviceId) { setErr('Semaine et service sont requis.'); return; }
    setSaving(true);
    const w = parseInt(semaine);

    // Upsert dans planning_cr
    const { data: existing } = await supabase.from('planning_cr').select('id').eq('semaine', w).maybeSingle();
    if (existing) {
      await supabase.from('planning_cr').update({ service_id: serviceId, date_prevue: datePrevue }).eq('semaine', w);
    } else {
      await supabase.from('planning_cr').insert({ semaine: w, service_id: serviceId, date_prevue: datePrevue });
    }

    setPlanningCR(p => ({
      ...p,
      [w]: { ...p[w], serviceId, datePrevue },
    }));
    setSaving(false);
    onClose();
  };

  return (
    <Modal title="Planifier un CR de réunion CoDcad" onClose={onClose}>
      <Select label="Numéro de la semaine" value={semaine} onChange={setSemaine} options={semaineOpts} required />
      <Select label="Service" value={serviceId} onChange={setSvc} options={svcOpts} required placeholder="Choisir un service…" />
      <Input label="Date prévue" value={datePrevue} onChange={setDate} type="date" />
      {err && <div style={{ color: C.urg, fontSize: 12, marginBottom: 10 }}>{err}</div>}
      <Btn onClick={submit} full disabled={saving}>{saving ? 'Enregistrement…' : 'Planifier'}</Btn>
    </Modal>
  );
}
