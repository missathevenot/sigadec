import { useState } from 'react';
import { C } from '../../constants/colors';
import { CORR_EMIS_STATUTS, CORR_RECU_STATUTS } from '../../constants/statuts';
import { IMPUTE_OPTIONS, EMIS_PAR_OPTIONS } from '../../constants/imputation';
import { fmtDate, today } from '../../utils/dates';
import { supabase } from '../../lib/supabase';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Btn from '../../components/ui/Btn';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Input from '../../components/ui/Input';

export default function CourrierDetail({ courrier, courriers, setCourriers, user, navigate }) {
  const [modalUpdate, setModalUpdate] = useState(false);
  const [modalEdit, setModalEdit]     = useState(false);
  const [deleting, setDeleting]       = useState(false);

  if (!courrier) return <div style={{ padding: 20, color: C.sec }}>Courrier introuvable.</div>;

  const allStatuts = courrier.sens === 'emis' ? CORR_EMIS_STATUTS : CORR_RECU_STATUTS;
  const st         = allStatuts.find(s => s.v === courrier.statut);
  const canEdit    = user.role !== 'secretariat';
  const isAdmin    = user.role === 'admin';

  const handleDelete = async () => {
    if (!window.confirm('Supprimer définitivement ce courrier ?')) return;
    setDeleting(true);
    await supabase.from('courriers').delete().eq('id', courrier.id);
    setCourriers(cs => cs.filter(c => c.id !== courrier.id));
    navigate('courriers');
  };

  return (
    <div style={{ padding: 14, animation: 'pageIn .22s ease-out' }}>
      <button onClick={() => navigate('courriers')} style={{ background: 'none', border: 'none', color: C.vert, fontWeight: 700, cursor: 'pointer', fontSize: 13, marginBottom: 12 }}>
        ← Retour
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: courrier.sens === 'recu' ? C.cours : C.vert }}>
          {courrier.sens === 'recu' ? '📥 Courrier reçu' : '📤 Courrier émis'}
        </span>
        {st && <Badge l={st.l} bg={st.bg} c={st.c} />}
      </div>

      <div style={{ fontFamily: 'monospace', fontSize: 11, color: C.sec, marginBottom: 4 }}>{courrier.reference}</div>
      <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 16, color: C.txt, marginBottom: 14, lineHeight: 1.4 }}>
        {courrier.objet}
      </div>

      <Card style={{ marginBottom: 12 }}>
        {courrier.sens === 'recu' && courrier.imputeA && (
          <Row label="Imputé"        value={courrier.imputeA} />
        )}
        {courrier.sens === 'emis' && courrier.emisPar && (
          <Row label="Emis par"      value={courrier.emisPar} />
        )}
        <Row label="Date"            value={fmtDate(courrier.dateEmission)} />
        {courrier.joursAttente > 0 && (
          <Row label="Jours d'attente" value={`${courrier.joursAttente}j`} />
        )}
      </Card>

      {courrier.corps && (
        <Card style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.sec, marginBottom: 6 }}>CORPS DU COURRIER</div>
          <div style={{ fontSize: 13, color: C.txt, lineHeight: 1.5 }}>{courrier.corps}</div>
        </Card>
      )}

      {courrier.noteInterne && (
        <Card style={{ marginBottom: 12, background: C.orngL }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.orng, marginBottom: 4 }}>📝 Note interne</div>
          <div style={{ fontSize: 12, color: C.orng }}>{courrier.noteInterne}</div>
        </Card>
      )}

      {courrier.fichierNom && (
        <Card style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.sec, marginBottom: 4 }}>DOCUMENT JOINT</div>
          <div style={{ fontSize: 13, color: C.cours }}>📄 {courrier.fichierNom}</div>
        </Card>
      )}

      {courrier.relances?.length > 0 && (
        <Card style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.sec, marginBottom: 8 }}>RELANCES</div>
          {courrier.relances.map((r, i) => (
            <div key={i} style={{ fontSize: 12, color: C.txt, marginBottom: 4 }}>
              🔔 {fmtDate(r.date)} — {r.auteur}
            </div>
          ))}
        </Card>
      )}

      {/* Boutons d'action */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Btn onClick={() => setModalUpdate(true)} full>Mettre à jour le statut</Btn>
        {canEdit && (
          <Btn onClick={() => setModalEdit(true)} full variant="secondary">✏️ Modifier le courrier</Btn>
        )}
        {isAdmin && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{ width: '100%', padding: '11px 0', background: '#FEF2F2', color: C.urg, border: `1.5px solid #FECACA`, borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
          >
            {deleting ? 'Suppression…' : '🗑️ Supprimer le courrier'}
          </button>
        )}
      </div>

      {modalUpdate && (
        <UpdateStatutModal courrier={courrier} setCourriers={setCourriers} user={user} onClose={() => setModalUpdate(false)} />
      )}
      {modalEdit && (
        <EditModal courrier={courrier} setCourriers={setCourriers} onClose={() => setModalEdit(false)} />
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

function EditModal({ courrier, setCourriers, onClose }) {
  const [objet, setObjet]     = useState(courrier.objet);
  const [imputeA, setImputeA] = useState(courrier.imputeA || '');
  const [emisPar, setEmisPar] = useState(courrier.emisPar || '');
  const [dateEm, setDateEm]   = useState(courrier.dateEmission || '');
  const [corps, setCorps]     = useState(courrier.corps || '');
  const [saving, setSaving]   = useState(false);
  const [err, setErr]         = useState('');

  const save = async () => {
    if (!objet.trim()) { setErr("L'objet est requis."); return; }
    setSaving(true);
    const updates = {
      objet: objet.trim(),
      impute_a:      courrier.sens === 'recu'  ? (imputeA || null) : courrier.imputeA,
      emis_par:      courrier.sens === 'emis'  ? (emisPar || null) : courrier.emisPar,
      date_emission: dateEm,
      corps,
    };
    await supabase.from('courriers').update(updates).eq('id', courrier.id);
    setCourriers(cs => cs.map(c => c.id === courrier.id
      ? { ...c, objet: objet.trim(), imputeA, emisPar, dateEmission: dateEm, corps }
      : c));
    setSaving(false);
    onClose();
  };

  return (
    <Modal title="Modifier le courrier" sub={courrier.reference} onClose={onClose}>
      <Input label="Objet" value={objet} onChange={setObjet} required />
      {courrier.sens === 'recu' && (
        <Select label="Imputé" value={imputeA} onChange={setImputeA} options={IMPUTE_OPTIONS} placeholder="Choisir…" />
      )}
      {courrier.sens === 'emis' && (
        <Select label="Emis par" value={emisPar} onChange={setEmisPar} options={EMIS_PAR_OPTIONS} placeholder="Choisir…" />
      )}
      <Input label="Date" value={dateEm} onChange={setDateEm} type="date" />
      <Textarea label="Corps du courrier" value={corps} onChange={setCorps} rows={3} />
      {err && <div style={{ color: C.urg, fontSize: 12, marginBottom: 10 }}>{err}</div>}
      <Btn onClick={save} full disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer les modifications'}</Btn>
    </Modal>
  );
}

function UpdateStatutModal({ courrier, setCourriers, user, onClose }) {
  const allStatuts = courrier.sens === 'emis' ? CORR_EMIS_STATUTS : CORR_RECU_STATUTS;
  const [statut, setStatut] = useState(courrier.statut);
  const [note, setNote]     = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const updates = { statut, note_interne: note || courrier.noteInterne };
    await supabase.from('courriers').update(updates).eq('id', courrier.id);
    setCourriers(cs => cs.map(c => c.id === courrier.id
      ? { ...c, statut, noteInterne: note || c.noteInterne }
      : c));
    setSaving(false);
    onClose();
  };

  return (
    <Modal title="Mettre à jour le courrier" sub={courrier.reference} onClose={onClose}>
      <Select
        label="Nouveau statut"
        value={statut}
        onChange={setStatut}
        options={allStatuts.map(s => ({ value: s.v, label: s.l }))}
        required
      />
      <Textarea label="Note interne (optionnel)" value={note} onChange={setNote} rows={2} />
      <Btn onClick={save} full disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Btn>
    </Modal>
  );
}
