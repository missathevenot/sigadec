import { useState } from 'react';
import { C } from '../../constants/colors';
import { USERS } from '../../constants/users';
import { SERVICES } from '../../constants/services';
import { CORR_EMIS_STATUTS, CORR_RECU_STATUTS } from '../../constants/statuts';
import { fmtDate, today } from '../../utils/dates';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Btn from '../../components/ui/Btn';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';

export default function CourrierDetail({ courrier, courriers, setCourriers, user, navigate }) {
  const [modalOpen, setModal] = useState(false);

  if (!courrier) return <div style={{ padding: 20, color: C.sec }}>Courrier introuvable.</div>;

  const allStatuts = courrier.sens === 'emis' ? CORR_EMIS_STATUTS : CORR_RECU_STATUTS;
  const st = allStatuts.find(s => s.v === courrier.statut);
  const assignee = USERS.find(u => u.id === courrier.assigneARoleId);
  const svcEm = SERVICES.find(s => s.id === courrier.serviceEmetteurId);

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
        <Row label="Partenaire" value={courrier.partenaire || '—'} />
        {courrier.sens === 'recu' && <Row label="Structure émettrice" value={courrier.structureEmettrice || '—'} />}
        {svcEm && <Row label="Service émetteur" value={svcEm.abbr} />}
        {assignee && <Row label="Imputé à" value={`${assignee.prenom} ${assignee.nom}`} />}
        <Row label="Date" value={fmtDate(courrier.dateEmission)} />
        {courrier.joursAttente > 0 && <Row label="Jours d'attente" value={`${courrier.joursAttente}j`} />}
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

      <Btn onClick={() => setModal(true)} full>Mettre à jour le statut</Btn>

      {modalOpen && (
        <UpdateStatutModal courrier={courrier} setCourriers={setCourriers} user={user} onClose={() => setModal(false)} />
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

function UpdateStatutModal({ courrier, setCourriers, user, onClose }) {
  const allStatuts = courrier.sens === 'emis' ? CORR_EMIS_STATUTS : CORR_RECU_STATUTS;
  const [statut, setStatut]   = useState(courrier.statut);
  const [note, setNote]       = useState('');

  const save = () => {
    setCourriers(cs => cs.map(c => c.id === courrier.id
      ? { ...c, statut, noteInterne: note || c.noteInterne }
      : c));
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
      <Btn onClick={save} full>Enregistrer</Btn>
    </Modal>
  );
}
