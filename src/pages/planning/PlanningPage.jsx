import { useState } from 'react';
import { C } from '../../constants/colors';
import { SERVICES } from '../../constants/services';
import { MOIS_NOMS } from '../../constants/mois';
import { PRINCIPES_VALEURS } from '../../constants/principes';
import { getImputeLabelForService } from '../../constants/imputation';
import { fmtDate, today, addDays } from '../../utils/dates';
import { isoWeek } from '../../utils/refs';
import { supabase } from '../../lib/supabase';
import Card from '../../components/ui/Card';
import Btn from '../../components/ui/Btn';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';

const ROLES_PLANIF = ['admin', 'directeur', 'conseiller_tech', 'sous_directeur'];

const SEMAINE_COURANTE = isoWeek(new Date());
const ANNEE_COURANTE   = new Date().getFullYear();

function lastIsoWeekOfYear(year) {
  return isoWeek(new Date(year, 11, 28));
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBlock: 6, borderBottom: `1px solid ${C.bord}`, fontSize: 13 }}>
      <span style={{ color: C.sec, fontWeight: 600, minWidth: 110 }}>{label}</span>
      <span style={{ color: C.txt, textAlign: 'right', flex: 1 }}>{value || '—'}</span>
    </div>
  );
}

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

export default function PlanningPage({ user, planningCharte, setPlanningCharte, planningCR, setPlanningCR, rapports }) {
  const [onglet, setOnglet]     = useState('charte');
  const [modalCharte, setMCh]   = useState(false);
  const [modalCR, setMCR]       = useState(false);
  const [editCharte, setEditCh] = useState(null);
  const [editCR, setEditCR]     = useState(null);
  const [viewCharte, setViewCh] = useState(null);
  const [viewCR, setViewCR]     = useState(null);

  const canPlan   = ROLES_PLANIF.includes(user.role);
  const canEdit   = user.role !== 'secretariat';
  const isAdmin   = user.role === 'admin';
  const MOIS_COURANT = new Date().getMonth() + 1;

  const sMin = Math.max(1, SEMAINE_COURANTE - 5);
  const sMax = Math.min(lastIsoWeekOfYear(ANNEE_COURANTE), SEMAINE_COURANTE + 10);

  const crEntries = Object.entries(planningCR)
    .map(([w, e]) => ({ w: parseInt(w), ...e }))
    .filter(e => e.w >= sMin && e.w <= sMax)
    .sort((a, b) => a.w - b.w);

  const charteDeposee = (moisNum, serviceId) =>
    (rapports || []).some(r =>
      r.type === "Commentaire de la Charte d'Ethique" &&
      r.moisDoc === moisNum &&
      r.serviceId === serviceId
    );

  const crDepose = (w) =>
    (rapports || []).some(r => r.type === 'Compte-rendu de réunion du comité' && r.semaine === w);

  const handleDeleteCharte = async (moisNum) => {
    if (!window.confirm(`Effacer la planification du mois ${MOIS_NOMS[moisNum - 1]} ?`)) return;
    await supabase.from('planning_charte')
      .update({ service_id: null, principe: null, date_soumis: null })
      .eq('mois', moisNum);
    setPlanningCharte(p => ({
      ...p,
      [moisNum]: { ...p[moisNum], serviceId: null, principe: null, dateSoumis: null },
    }));
  };

  const handleDeleteCR = async (semaine) => {
    if (!window.confirm(`Supprimer la planification de la semaine ${semaine} ?`)) return;
    await supabase.from('planning_cr').delete().eq('semaine', semaine);
    setPlanningCR(p => {
      const next = { ...p };
      delete next[semaine];
      return next;
    });
  };

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
            {canPlan && <Btn size="sm" onClick={() => setMCh(true)}>+ Planifier</Btn>}
          </div>

          {Object.entries(planningCharte)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([m, entry]) => {
              const moisNum   = parseInt(m);
              const svc       = SERVICES.find(s => s.id === entry.serviceId);
              const isCurrent = moisNum === MOIS_COURANT;
              const soumis    = charteDeposee(moisNum, entry.serviceId);
              return (
                <Card key={m} style={{
                  marginBottom: 8,
                  borderLeft: isCurrent ? `3px solid ${C.vert}` : `3px solid transparent`,
                  background: isCurrent ? C.vertL : C.blanc,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{ fontWeight: 800, fontSize: 14, color: C.txt }}>{entry.mois}</span>
                        {isCurrent && (
                          <span style={{ fontSize: 9, background: C.vert, color: C.blanc, borderRadius: 6, padding: '1px 6px', fontWeight: 700 }}>EN COURS</span>
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
                        ? <div style={{ color: C.ok,   fontWeight: 700, fontSize: 11 }}>✅ Déposé</div>
                        : <div style={{ color: C.orng, fontWeight: 700, fontSize: 11 }}>⏳ En attente</div>
                      }
                    </div>
                  </div>
                  {canEdit && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <ActionBtn label="👁 Afficher"  color={C.cours} bg={C.coursB} onClick={() => setViewCh(moisNum)} />
                      <ActionBtn label="✏️ Modifier"  color={C.vert}  bg={C.vertL}  onClick={() => setEditCh(moisNum)} />
                      {isAdmin && (
                        <ActionBtn label="🗑️" color={C.urg} bg="#FEF2F2"
                          onClick={() => { handleDeleteCharte(moisNum); }}
                        />
                      )}
                    </div>
                  )}
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
            {canPlan && <Btn size="sm" onClick={() => setMCR(true)}>+ Planifier</Btn>}
          </div>

          {crEntries.length === 0 && (
            <div style={{ textAlign: 'center', color: C.sec, fontSize: 13, paddingTop: 24 }}>Aucune semaine à afficher.</div>
          )}

          {crEntries.map(({ w, serviceId, datePrevue, dateLecture }) => {
            const svc       = SERVICES.find(s => s.id === serviceId);
            const isCurrent = w === SEMAINE_COURANTE;
            const depose    = crDepose(w);
            return (
              <div key={w} style={{
                padding: '10px 14px', borderRadius: 10, marginBottom: 8,
                background: isCurrent ? C.vertL : C.blanc,
                border: isCurrent ? `1.5px solid ${C.vert}` : `1px solid ${C.bord}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: isCurrent ? 800 : 600, color: isCurrent ? C.vert : C.txt }}>
                        {isCurrent ? '▶ ' : ''}Semaine {w}
                      </span>
                      {isCurrent && (
                        <span style={{ fontSize: 9, background: C.vert, color: C.blanc, borderRadius: 6, padding: '1px 6px', fontWeight: 700 }}>ACTUELLE</span>
                      )}
                    </div>
                    {datePrevue && (
                      <div style={{ fontSize: 11, color: C.sec, marginTop: 2 }}>📅 Date prévue : {fmtDate(datePrevue)}</div>
                    )}
                    {dateLecture && (
                      <div style={{ fontSize: 11, color: C.cours, marginTop: 2 }}>📖 Date lecture : {fmtDate(dateLecture)}</div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', maxWidth: 160 }}>
                    <div style={{ fontSize: 11, color: C.vert, fontWeight: 700, textAlign: 'right', lineHeight: 1.3 }}>
                      {getImputeLabelForService(serviceId) || svc?.abbr || '—'}
                    </div>
                    {depose
                      ? <div style={{ fontSize: 10, color: C.ok,  fontWeight: 600 }}>✅ Déposé</div>
                      : <div style={{ fontSize: 10, color: C.sec }}>⏳ En attente</div>
                    }
                  </div>
                </div>
                {canEdit && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <ActionBtn label="👁 Afficher"  color={C.cours} bg={C.coursB} onClick={() => setViewCR(w)} />
                    <ActionBtn label="✏️ Modifier"  color={C.vert}  bg={C.vertL}  onClick={() => setEditCR(w)} />
                    {isAdmin && (
                      <ActionBtn label="🗑️" color={C.urg} bg="#FEF2F2"
                        onClick={() => { handleDeleteCR(w); }}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modals Planifier */}
      {modalCharte && (
        <PlanifierCharteModal planningCharte={planningCharte} setPlanningCharte={setPlanningCharte} user={user} onClose={() => setMCh(false)} />
      )}
      {modalCR && (
        <PlanifierCRModal planningCR={planningCR} setPlanningCR={setPlanningCR} user={user} onClose={() => setMCR(false)} />
      )}

      {/* Modals View */}
      {viewCharte !== null && (
        <ViewCharteModal moisNum={viewCharte} entry={planningCharte[viewCharte]} onClose={() => setViewCh(null)} />
      )}
      {viewCR !== null && (
        <ViewCRModal semaine={viewCR} entry={planningCR[viewCR]} onClose={() => setViewCR(null)} />
      )}

      {/* Modals Éditer */}
      {editCharte !== null && (
        <EditCharteModal
          moisNum={editCharte}
          entry={planningCharte[editCharte]}
          setPlanningCharte={setPlanningCharte}
          isAdmin={isAdmin}
          onDelete={() => { handleDeleteCharte(editCharte); setEditCh(null); }}
          onClose={() => setEditCh(null)}
        />
      )}
      {editCR !== null && (
        <EditCRModal
          semaine={editCR}
          entry={planningCR[editCR]}
          setPlanningCR={setPlanningCR}
          isAdmin={isAdmin}
          canEditLecture={user.role !== 'secretariat'}
          onDelete={() => { handleDeleteCR(editCR); setEditCR(null); }}
          onClose={() => setEditCR(null)}
        />
      )}
    </div>
  );
}

/* ── Modal Planifier Charte ── */
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

/* ── Modal Planifier CR ── */
function PlanifierCRModal({ planningCR, setPlanningCR, user, onClose }) {
  const lastWeek  = lastIsoWeekOfYear(ANNEE_COURANTE);
  const canEdit   = user.role !== 'secretariat';
  const [semaine, setSemaine]         = useState(String(SEMAINE_COURANTE));
  const [serviceId, setSvc]           = useState('');
  const [datePrevue, setDatePrevue]   = useState(today());
  const [dateLecture, setDateLecture] = useState(addDays(today(), 7));
  const [saving, setSaving]           = useState(false);
  const [err, setErr]                 = useState('');

  const handleDatePrevue = (val) => {
    setDatePrevue(val);
    setDateLecture(addDays(val, 7));
  };

  const semaineOpts = Array.from({ length: lastWeek }, (_, i) => ({
    value: String(i + 1),
    label: `Semaine ${i + 1}${i + 1 === SEMAINE_COURANTE ? ' (actuelle)' : ''}`,
  }));
  const svcOpts = SERVICES.map(s => ({ value: s.id, label: `${s.abbr} — ${s.nom.substring(0, 28)}…` }));

  const submit = async () => {
    if (!semaine || !serviceId) { setErr('Semaine et service sont requis.'); return; }
    setSaving(true);
    const w = parseInt(semaine);
    const { data: existing } = await supabase.from('planning_cr').select('id').eq('semaine', w).maybeSingle();
    const row = { service_id: serviceId, date_prevue: datePrevue, date_lecture: dateLecture || null };
    if (existing) {
      await supabase.from('planning_cr').update(row).eq('semaine', w);
    } else {
      await supabase.from('planning_cr').insert({ semaine: w, ...row });
    }
    setPlanningCR(p => ({ ...p, [w]: { ...p[w], serviceId, datePrevue, dateLecture: dateLecture || null } }));
    setSaving(false);
    onClose();
  };

  return (
    <Modal title="Planifier un CR de réunion CoDcad" onClose={onClose}>
      <Select label="Numéro de la semaine" value={semaine} onChange={setSemaine} options={semaineOpts} required />
      <Select label="Service" value={serviceId} onChange={setSvc} options={svcOpts} required placeholder="Choisir un service…" />
      <Input label="Date prévue" value={datePrevue} onChange={handleDatePrevue} type="date" />
      <Input
        label="Date de lecture du CR"
        value={dateLecture}
        onChange={canEdit ? setDateLecture : undefined}
        type="date"
        disabled={!canEdit}
      />
      {err && <div style={{ color: C.urg, fontSize: 12, marginBottom: 10 }}>{err}</div>}
      <Btn onClick={submit} full disabled={saving}>{saving ? 'Enregistrement…' : 'Planifier'}</Btn>
    </Modal>
  );
}

/* ── Modal View Charte ── */
function ViewCharteModal({ moisNum, entry, onClose }) {
  const moisNom = MOIS_NOMS[moisNum - 1];
  const svc     = SERVICES.find(s => s.id === entry?.serviceId);
  return (
    <Modal title={`Charte Éthique — ${moisNom}`} onClose={onClose}>
      <Row label="Mois"         value={`${moisNom} ${ANNEE_COURANTE}`} />
      <Row label="Service"      value={svc ? `${svc.abbr} — ${svc.nom}` : '—'} />
      <Row label="Principe"     value={entry?.principe} />
      <Row label="Date prévue"  value={entry?.dateSoumis ? fmtDate(entry.dateSoumis) : '—'} />
    </Modal>
  );
}

/* ── Modal View CR ── */
function ViewCRModal({ semaine, entry, onClose }) {
  const svc = SERVICES.find(s => s.id === entry?.serviceId);
  return (
    <Modal title={`CR CoDcad — Semaine ${semaine}`} onClose={onClose}>
      <Row label="Semaine"         value={`${semaine} — ${ANNEE_COURANTE}`} />
      <Row label="Service"         value={svc ? `${svc.abbr} — ${svc.nom}` : '—'} />
      <Row label="Date prévue"     value={entry?.datePrevue  ? fmtDate(entry.datePrevue)  : '—'} />
      <Row label="Date de lecture" value={entry?.dateLecture ? fmtDate(entry.dateLecture) : '—'} />
    </Modal>
  );
}

/* ── Modal Éditer Charte ── */
function EditCharteModal({ moisNum, entry, setPlanningCharte, isAdmin, onDelete, onClose }) {
  const [serviceId, setSvc]     = useState(entry?.serviceId || '');
  const [principe, setPrincipe] = useState(entry?.principe || '');
  const [datePrevue, setDate]   = useState(entry?.dateSoumis || today());
  const [saving, setSaving]     = useState(false);

  const svcOpts      = SERVICES.map(s => ({ value: s.id, label: `${s.abbr} — ${s.nom.substring(0, 28)}…` }));
  const principeOpts = PRINCIPES_VALEURS.map(p => ({ value: p, label: p }));
  const moisNom      = MOIS_NOMS[moisNum - 1];

  const save = async () => {
    setSaving(true);
    await supabase.from('planning_charte')
      .update({ service_id: serviceId || null, principe: principe || null, date_soumis: datePrevue })
      .eq('mois', moisNum);
    setPlanningCharte(p => ({
      ...p,
      [moisNum]: { ...p[moisNum], serviceId, principe, dateSoumis: datePrevue },
    }));
    setSaving(false);
    onClose();
  };

  return (
    <Modal title={`Modifier — ${moisNom}`} sub={`Charte Éthique ${ANNEE_COURANTE}`} onClose={onClose}>
      <Select label="Service" value={serviceId} onChange={setSvc} options={svcOpts} placeholder="Choisir un service…" />
      <Select label="Principes et valeurs" value={principe} onChange={setPrincipe} options={principeOpts} placeholder="Choisir un principe…" />
      <Input label="Date prévue" value={datePrevue} onChange={setDate} type="date" />
      <Btn onClick={save} full disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer les modifications'}</Btn>
      {isAdmin && (
        <button onClick={onDelete} style={{ width: '100%', marginTop: 8, padding: '10px 0', background: '#FEF2F2', color: C.urg, border: `1.5px solid #FECACA`, borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          🗑️ Effacer la planification
        </button>
      )}
    </Modal>
  );
}

/* ── Modal Éditer CR ── */
function EditCRModal({ semaine, entry, setPlanningCR, isAdmin, canEditLecture, onDelete, onClose }) {
  const [serviceId, setSvc]           = useState(entry?.serviceId || '');
  const [datePrevue, setDatePrevue]   = useState(entry?.datePrevue  || today());
  const [dateLecture, setDateLecture] = useState(entry?.dateLecture || addDays(entry?.datePrevue || today(), 7));
  const [saving, setSaving]           = useState(false);

  const svcOpts = SERVICES.map(s => ({ value: s.id, label: `${s.abbr} — ${s.nom.substring(0, 28)}…` }));

  const handleDatePrevue = (val) => {
    setDatePrevue(val);
    if (!entry?.dateLecture) setDateLecture(addDays(val, 7));
  };

  const save = async () => {
    setSaving(true);
    const row = { service_id: serviceId || null, date_prevue: datePrevue, date_lecture: dateLecture || null };
    const { data: existing } = await supabase.from('planning_cr').select('id').eq('semaine', semaine).maybeSingle();
    if (existing) {
      await supabase.from('planning_cr').update(row).eq('semaine', semaine);
    } else {
      await supabase.from('planning_cr').insert({ semaine, ...row });
    }
    setPlanningCR(p => ({ ...p, [semaine]: { ...p[semaine], serviceId, datePrevue, dateLecture: dateLecture || null } }));
    setSaving(false);
    onClose();
  };

  return (
    <Modal title={`CR CoDcad — Semaine ${semaine}`} sub={String(ANNEE_COURANTE)} onClose={onClose}>
      <Select label="Service" value={serviceId} onChange={setSvc} options={svcOpts} placeholder="Choisir un service…" />
      <Input label="Date prévue" value={datePrevue} onChange={handleDatePrevue} type="date" />
      <Input
        label="Date de lecture du CR"
        value={dateLecture}
        onChange={canEditLecture ? setDateLecture : undefined}
        type="date"
        disabled={!canEditLecture}
      />
      <Btn onClick={save} full disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer les modifications'}</Btn>
      {isAdmin && (
        <button onClick={onDelete} style={{ width: '100%', marginTop: 8, padding: '10px 0', background: '#FEF2F2', color: C.urg, border: `1.5px solid #FECACA`, borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          🗑️ Supprimer cette planification
        </button>
      )}
    </Modal>
  );
}
