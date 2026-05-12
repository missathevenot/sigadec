import { useState } from 'react';
import { C } from '../../constants/colors';
import { DIL_STATUTS } from '../../constants/statuts';
import { IMPUTE_OPTIONS } from '../../constants/imputation';
import { fmtDate, today } from '../../utils/dates';
import { supabase } from '../../lib/supabase';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Btn from '../../components/ui/Btn';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Input from '../../components/ui/Input';
import MultiSelectImpute from '../../components/ui/MultiSelectImpute';
import { isLate, isUrgentSoon, isTodayDue, ProgBar } from '../../components/shared/DilCardShared';

/** Supprime le numéro d'ordre initial (ex: "7. Objet…" → "Objet…") */
function stripOrderNum(text) {
  return (text || '').replace(/^\d+\.\s*/, '');
}

export default function DiligenceDetail({ diligence, diligences, setDiligences, courriers, user, navigate }) {
  const [modalEdit, setModalEdit] = useState(false);
  const [deleting, setDeleting]   = useState(false);

  if (!diligence) return <div style={{ padding: 20, textAlign: 'center', color: C.sec }}>Diligence introuvable.</div>;

  const st             = DIL_STATUTS.find(s => s.v === diligence.statut);
  const likedCourriers = (diligence.courrierIds || []).map(id => courriers?.find(c => c.id === id)).filter(Boolean);
  const canEdit        = user.role !== 'secretariat';
  const isAdmin        = user.role === 'admin';

  // ── Couleurs urgence (même logique que la liste) ──
  const late        = isLate(diligence);
  const urgent      = isUrgentSoon(diligence);
  const dueDay      = isTodayDue(diligence);
  const borderColor = late ? C.urg : urgent ? C.orng : dueDay ? C.orng : C.bord;
  const headerBg    = late ? '#FFF8F8' : urgent ? '#FFFBF2' : C.blanc;

  const handleDelete = async () => {
    if (!window.confirm('Supprimer définitivement cette diligence ?')) return;
    setDeleting(true);
    await supabase.from('diligences').delete().eq('id', diligence.id);
    setDiligences(ds => ds.filter(d => d.id !== diligence.id));
    navigate('diligences');
  };

  return (
    <div style={{ padding: '14px', animation: 'pageIn .22s ease-out' }}>
      <button onClick={() => navigate('diligences')} style={{
        background: 'none', border: 'none', color: C.vert,
        fontWeight: 700, cursor: 'pointer', fontSize: 13, marginBottom: 12,
      }}>
        ← Retour
      </button>

      {/* En-tête coloré selon urgence */}
      <div style={{
        background: headerBg,
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: 12,
        padding: '14px',
        marginBottom: 14,
        boxShadow: late ? `0 2px 8px ${C.urg}20` : urgent ? `0 2px 8px ${C.orng}20` : '0 1px 6px rgba(0,0,0,.07)',
      }}>
        {/* Badge urgence */}
        {(late || dueDay) && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: late ? C.urgB : '#FFF3CD',
            color: late ? C.urg : '#856404',
            border: `1px solid ${late ? C.urg : C.orng}`,
            borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 800,
            marginBottom: 8,
          }}>
            {late ? '🔴 EN RETARD' : '🟡 AUJOURD\'HUI'}
          </div>
        )}

        <div style={{ fontFamily: 'monospace', fontSize: 11, color: C.sec, marginBottom: 4 }}>
          {diligence.reference}
        </div>
        <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 17, color: C.txt, marginBottom: 10, lineHeight: 1.4 }}>
          {diligence.intitule}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
          {st && <Badge l={st.l} bg={st.bg} c={st.c} />}
          <span style={{ fontSize: 12, color: C.sec }}>{diligence.progression ?? 0}%</span>
        </div>

        {/* Barre de progression */}
        <div style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: C.sec, fontWeight: 600 }}>Taux de réalisation</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: borderColor }}>{diligence.progression ?? 0}%</span>
          </div>
          <ProgBar v={diligence.progression ?? 0} d={diligence} />
        </div>
      </div>

      {/* Infos principales */}
      <Card style={{ marginBottom: 12 }}>
        <div style={{ paddingBlock: 6, borderBottom: `1px solid ${C.bord}` }}>
          <span style={{ fontSize: 12, color: C.sec, fontWeight: 600 }}>Imputée à</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
            {(Array.isArray(diligence.imputeA) ? diligence.imputeA : [diligence.imputeA]).filter(Boolean).length > 0
              ? (Array.isArray(diligence.imputeA) ? diligence.imputeA : [diligence.imputeA]).filter(Boolean).map(v => (
                  <span key={v} style={{ background: C.coursB, color: C.cours, borderRadius: 8, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{v}</span>
                ))
              : <span style={{ fontSize: 13, color: C.sec }}>—</span>
            }
          </div>
        </div>
        <Row label="Soumis le" value={fmtDate(diligence.dateSubmission)} />
        <Row label="Échéance"  value={fmtDate(diligence.echeance)} />
      </Card>

      {/* Report */}
      {diligence.statut === 'reportee' && (
        <div style={{ background: C.orngL, borderRadius: 10, padding: '10px 12px', marginBottom: 12, borderLeft: `3px solid ${C.orng}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.orng, marginBottom: 4 }}>📆 Diligence reportée</div>
          <div style={{ fontSize: 12, color: C.orng }}>Nouvelle échéance : {fmtDate(diligence.dateReport)}</div>
          {diligence.facteursReport && <div style={{ fontSize: 11, color: C.orng, marginTop: 4 }}>Motif : {diligence.facteursReport}</div>}
        </div>
      )}

      {/* Document joint */}
      {diligence.fichierNom && (
        <Card style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.sec, marginBottom: 6 }}>DOCUMENT JOINT</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span>📄</span>
            <span style={{ fontSize: 13, color: C.cours }}>{diligence.fichierNom}</span>
          </div>
          {diligence.objetDoc && <div style={{ fontSize: 11, color: C.sec, marginTop: 4 }}>{diligence.objetDoc}</div>}
        </Card>
      )}

      {/* Courriers liés */}
      {likedCourriers.length > 0 && (
        <Card style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.sec, marginBottom: 8 }}>COURRIERS LIÉS</div>
          {likedCourriers.map(c => (
            <div key={c.id} style={{ fontSize: 12, color: C.cours, marginBottom: 4 }}>✉️ {c.reference} — {c.objet}</div>
          ))}
        </Card>
      )}

      {/* Description */}
      {diligence.description && (
        <Card style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.sec, marginBottom: 6 }}>DESCRIPTION</div>
          <div style={{ fontSize: 13, color: C.txt, lineHeight: 1.5 }}>{diligence.description}</div>
        </Card>
      )}

      {/* Historique */}
      {diligence.historique?.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.sec, marginBottom: 8 }}>HISTORIQUE</div>
          {[...diligence.historique].reverse().map((h, i) => {
            const hst = DIL_STATUTS.find(s => s.v === h.statut);
            return (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 2, background: C.bord, flexShrink: 0 }} />
                <div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: C.sec }}>{fmtDate(h.date)}</span>
                    {hst && <Badge l={hst.l} bg={hst.bg} c={hst.c} />}
                    <span style={{ fontSize: 11, color: C.sec }}>{h.progression}%</span>
                  </div>
                  <div style={{ fontSize: 12, color: C.txt }}>{h.commentaire}</div>
                  <div style={{ fontSize: 11, color: C.sec, marginTop: 2 }}>par {h.auteur}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Boutons d'action — "Mettre à jour la progression" supprimé */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {canEdit && (
          <Btn onClick={() => setModalEdit(true)} full variant="secondary">✏️ Modifier la diligence</Btn>
        )}
        {isAdmin && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{ width: '100%', padding: '11px 0', background: '#FEF2F2', color: C.urg, border: `1.5px solid #FECACA`, borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
          >
            {deleting ? 'Suppression…' : '🗑️ Supprimer la diligence'}
          </button>
        )}
      </div>

      {modalEdit && (
        <EditModal diligence={diligence} setDiligences={setDiligences} onClose={() => setModalEdit(false)} />
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBlock: 6, borderBottom: `1px solid ${C.bord}`, fontSize: 13 }}>
      <span style={{ color: C.sec, fontWeight: 600 }}>{label}</span>
      <span style={{ color: C.txt, textAlign: 'right', maxWidth: '60%' }}>{value}</span>
    </div>
  );
}

function EditModal({ diligence, setDiligences, onClose }) {
  const [intitule, setIntitule] = useState(diligence.intitule);
  const [imputeA, setImputeA]   = useState(Array.isArray(diligence.imputeA) ? diligence.imputeA : []);
  const [echeance, setEcheance] = useState(diligence.echeance || '');
  const [description, setDesc]  = useState(diligence.description || '');
  const [statut, setStatut]     = useState(diligence.statut);
  const [progression, setProg]  = useState(diligence.progression ?? 0);
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState('');

  // Auto 100% quand statut → Exécutée
  const handleStatutChange = (v) => {
    setStatut(v);
    if (v === 'executee') setProg(100);
  };

  const save = async () => {
    if (!intitule.trim()) { setErr("L'objet est requis."); return; }
    setSaving(true);
    // Supprime le n° d'ordre si statut devient Exécutée
    const finalIntitule = statut === 'executee'
      ? stripOrderNum(intitule.trim())
      : intitule.trim();
    const finalProg = statut === 'executee' ? 100 : Number(progression);
    const updates = {
      intitule: finalIntitule, impute_a: imputeA, echeance,
      description, statut, progression: finalProg,
    };
    await supabase.from('diligences').update(updates).eq('id', diligence.id);
    setDiligences(ds => ds.map(d => d.id === diligence.id
      ? { ...d, intitule: finalIntitule, imputeA, echeance, description, statut, progression: finalProg }
      : d));
    setSaving(false);
    onClose();
  };

  return (
    <Modal title="Modifier la diligence" sub={diligence.reference} onClose={onClose}>
      <Input label="Objet de la diligence" value={intitule} onChange={setIntitule} required />
      <MultiSelectImpute label="Imputée à" selected={imputeA} onChange={setImputeA} options={IMPUTE_OPTIONS} placeholder="Choisir…" />
      <Select label="Statut" value={statut} onChange={handleStatutChange} options={DIL_STATUTS.map(s => ({ value: s.v, label: s.l }))} required />
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.sec, marginBottom: 4 }}>
          Taux de réalisation : <span style={{ color: C.vert, fontWeight: 800 }}>{progression}%</span>
        </label>
        <input type="range" min={0} max={100} value={progression}
          onChange={e => setProg(e.target.value)}
          style={{ width: '100%', accentColor: C.vert }} />
      </div>
      <Input label="Date d'échéance" value={echeance} onChange={setEcheance} type="date" />
      <Textarea label="Description" value={description} onChange={setDesc} rows={3} />
      {err && <div style={{ color: C.urg, fontSize: 12, marginBottom: 10 }}>{err}</div>}
      <Btn onClick={save} full disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer les modifications'}</Btn>
    </Modal>
  );
}
