import { useState } from 'react';
import { C } from '../../constants/colors';
import { DIL_STATUTS } from '../../constants/statuts';
import { IMPUTE_OPTIONS } from '../../constants/imputation';
import { fmtDate, today } from '../../utils/dates';
import { supabase } from '../../lib/supabase';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import PBar from '../../components/ui/PBar';
import Btn from '../../components/ui/Btn';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Input from '../../components/ui/Input';

export default function DiligenceDetail({ diligence, diligences, setDiligences, courriers, user, navigate }) {
  const [modalUpdate, setModalUpdate] = useState(false);
  const [modalEdit, setModalEdit]     = useState(false);
  const [deleting, setDeleting]       = useState(false);

  if (!diligence) return <div style={{ padding: 20, textAlign: 'center', color: C.sec }}>Diligence introuvable.</div>;

  const st            = DIL_STATUTS.find(s => s.v === diligence.statut);
  const likedCourriers = (diligence.courrierIds || []).map(id => courriers?.find(c => c.id === id)).filter(Boolean);
  const canEdit       = user.role !== 'secretariat';
  const isAdmin       = user.role === 'admin';

  const handleDelete = async () => {
    if (!window.confirm('Supprimer définitivement cette diligence ?')) return;
    setDeleting(true);
    await supabase.from('diligences').delete().eq('id', diligence.id);
    setDiligences(ds => ds.filter(d => d.id !== diligence.id));
    navigate('diligences');
  };

  return (
    <div style={{ padding: '14px', animation: 'pageIn .22s ease-out' }}>
      <button onClick={() => navigate('diligences')} style={{ background: 'none', border: 'none', color: C.vert, fontWeight: 700, cursor: 'pointer', fontSize: 13, marginBottom: 12 }}>
        ← Retour
      </button>

      <div style={{ fontFamily: 'monospace', fontSize: 11, color: C.sec, marginBottom: 4 }}>{diligence.reference}</div>
      <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 17, color: C.txt, marginBottom: 10, lineHeight: 1.4 }}>{diligence.intitule}</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
        {st && <Badge l={st.l} bg={st.bg} c={st.c} />}
        <span style={{ fontSize: 12, color: C.sec }}>{diligence.progression ?? 0}%</span>
      </div>

      {/* Barre de progression */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: C.sec, fontWeight: 600 }}>Taux de réalisation</span>
          <span style={{ fontSize: 12, fontWeight: 800, color: C.vert }}>{diligence.progression ?? 0}%</span>
        </div>
        <PBar v={diligence.progression ?? 0} />
      </div>

      <Card style={{ marginBottom: 12 }}>
        <Row label="Imputée à"  value={diligence.imputeA || '—'} />
        <Row label="Soumis le"  value={fmtDate(diligence.dateSubmission)} />
        <Row label="Échéance"   value={fmtDate(diligence.echeance)} />
      </Card>

      {diligence.statut === 'reportee' && (
        <div style={{ background: C.orngL, borderRadius: 10, padding: '10px 12px', marginBottom: 12, borderLeft: `3px solid ${C.orng}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.orng, marginBottom: 4 }}>📆 Diligence reportée</div>
          <div style={{ fontSize: 12, color: C.orng }}>Nouvelle échéance : {fmtDate(diligence.dateReport)}</div>
          {diligence.facteursReport && <div style={{ fontSize: 11, color: C.orng, marginTop: 4 }}>Motif : {diligence.facteursReport}</div>}
        </div>
      )}

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

      {likedCourriers.length > 0 && (
        <Card style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.sec, marginBottom: 8 }}>COURRIERS LIÉS</div>
          {likedCourriers.map(c => (
            <div key={c.id} style={{ fontSize: 12, color: C.cours, marginBottom: 4 }}>✉️ {c.reference} — {c.objet}</div>
          ))}
        </Card>
      )}

      {diligence.description && (
        <Card style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.sec, marginBottom: 6 }}>DESCRIPTION</div>
          <div style={{ fontSize: 13, color: C.txt, lineHeight: 1.5 }}>{diligence.description}</div>
        </Card>
      )}

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

      {/* Boutons d'action */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Btn onClick={() => setModalUpdate(true)} full>Mettre à jour la progression</Btn>
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

      {modalUpdate && (
        <UpdateModal diligence={diligence} setDiligences={setDiligences} user={user} onClose={() => setModalUpdate(false)} />
      )}
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
  const [intitule, setIntitule]   = useState(diligence.intitule);
  const [imputeA, setImputeA]     = useState(diligence.imputeA || '');
  const [echeance, setEcheance]   = useState(diligence.echeance || '');
  const [description, setDesc]    = useState(diligence.description || '');
  const [saving, setSaving]       = useState(false);
  const [err, setErr]             = useState('');

  const save = async () => {
    if (!intitule.trim()) { setErr("L'objet est requis."); return; }
    setSaving(true);
    const updates = { intitule: intitule.trim(), impute_a: imputeA || null, echeance, description };
    await supabase.from('diligences').update(updates).eq('id', diligence.id);
    setDiligences(ds => ds.map(d => d.id === diligence.id
      ? { ...d, intitule: intitule.trim(), imputeA, echeance, description }
      : d));
    setSaving(false);
    onClose();
  };

  return (
    <Modal title="Modifier la diligence" sub={diligence.reference} onClose={onClose}>
      <Input label="Objet de la diligence" value={intitule} onChange={setIntitule} required />
      <Select label="Imputée à" value={imputeA} onChange={setImputeA} options={IMPUTE_OPTIONS} placeholder="Choisir…" />
      <Input label="Date d'échéance" value={echeance} onChange={setEcheance} type="date" />
      <Textarea label="Description" value={description} onChange={setDesc} rows={3} />
      {err && <div style={{ color: C.urg, fontSize: 12, marginBottom: 10 }}>{err}</div>}
      <Btn onClick={save} full disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer les modifications'}</Btn>
    </Modal>
  );
}

function UpdateModal({ diligence, setDiligences, user, onClose }) {
  const [statut, setStatut]           = useState(diligence.statut);
  const [progression, setProgression] = useState(diligence.progression ?? 0);
  const [commentaire, setCommentaire] = useState('');
  const [dateReport, setDateReport]   = useState('');
  const [facteursReport, setFacteurs] = useState('');
  const [saving, setSaving]           = useState(false);
  const [err, setErr]                 = useState('');

  const save = async () => {
    if (!commentaire.trim()) { setErr('Le commentaire est obligatoire.'); return; }
    if (statut === 'reportee' && !dateReport) { setErr('La nouvelle date est requise.'); return; }
    setSaving(true);
    const entry = {
      date: today(), statut, progression: Number(progression),
      commentaire: commentaire.trim(), auteur: `${user.prenom} ${user.nom}`,
    };
    const newHisto = [...(diligence.historique || []), entry];
    const updates = {
      statut, progression: Number(progression), historique: newHisto,
      date_report:      statut === 'reportee' ? dateReport     : diligence.dateReport,
      facteurs_report:  statut === 'reportee' ? facteursReport : diligence.facteursReport,
    };
    await supabase.from('diligences').update(updates).eq('id', diligence.id);
    setDiligences(ds => ds.map(d => d.id === diligence.id
      ? { ...d, statut, progression: Number(progression), historique: newHisto,
          dateReport: updates.date_report, facteursReport: updates.facteurs_report }
      : d));
    setSaving(false);
    onClose();
  };

  return (
    <Modal title="Mettre à jour la diligence" sub={diligence.reference} onClose={onClose}>
      <Select label="Nouveau statut" value={statut} onChange={setStatut} options={DIL_STATUTS.map(s => ({ value: s.v, label: s.l }))} required />
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.sec, marginBottom: 4 }}>
          Progression : {progression}%
        </label>
        <input type="range" min={0} max={100} value={progression} onChange={e => setProgression(e.target.value)} style={{ width: '100%' }} />
      </div>
      {statut === 'reportee' && (
        <>
          <Input label="Nouvelle date d'échéance" value={dateReport} onChange={setDateReport} type="date" required />
          <Textarea label="Facteurs explicatifs du report" value={facteursReport} onChange={setFacteurs} rows={2} />
        </>
      )}
      <Textarea label="Commentaire" value={commentaire} onChange={setCommentaire} rows={3} required />
      {err && <div style={{ color: C.urg, fontSize: 12, marginBottom: 10 }}>{err}</div>}
      <Btn onClick={save} full disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer la mise à jour'}</Btn>
    </Modal>
  );
}
