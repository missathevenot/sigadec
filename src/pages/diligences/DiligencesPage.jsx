import { useState } from 'react';
import { C } from '../../constants/colors';
import { USERS } from '../../constants/users';
import { SERVICES } from '../../constants/services';
import { ROLES_LABELS, ROLES_SOUMISSION_DIL } from '../../constants/roles';
import { DIL_STATUTS } from '../../constants/statuts';
import { fmtDate, today } from '../../utils/dates';
import { matchSearch } from '../../utils/search';
import { genRef } from '../../utils/refs';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Av from '../../components/ui/Av';
import PBar from '../../components/ui/PBar';
import Btn from '../../components/ui/Btn';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import UploadZone from '../../components/ui/UploadZone';
import MultiSelectService from '../../components/ui/MultiSelectService';
import EmptyState from '../../components/ui/EmptyState';
import YearMonthFilter from '../../components/shared/YearMonthFilter';

const STATUT_FILTRES = [
  { v: 'non_executee', l: 'Actives' },
  { v: 'en_cours',     l: 'En cours' },
  { v: 'non_echu',     l: 'Non Échu' },
  { v: 'reportee',     l: 'Reportée' },
  { v: 'executee',     l: 'Exécutée' },
  { v: 'supprimee',    l: 'Supprimée' },
  { v: 'all',          l: 'Toutes' },
];

export default function DiligencesPage({ diligences, setDiligences, courriers, user, navigate }) {
  const [search, setSearch]     = useState('');
  const [filtre, setFiltre]     = useState('non_executee');
  const [year, setYear]         = useState(null);
  const [month, setMonth]       = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = diligences
    .filter(d => {
      if (!matchSearch(d, search)) return false;
      if (filtre === 'non_executee' && ['executee','supprimee'].includes(d.statut)) return false;
      if (!['all','non_executee'].includes(filtre) && d.statut !== filtre) return false;
      if (year) {
        const y = parseInt(d.dateSubmission?.split('-')[0]);
        if (y !== year) return false;
      }
      if (month) {
        const m = parseInt(d.dateSubmission?.split('-')[1]);
        if (m !== month) return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.dateSubmission) - new Date(a.dateSubmission));

  const canSubmit = ROLES_SOUMISSION_DIL.includes(user.role);

  return (
    <div style={{ padding: '14px 14px 0', animation: 'pageIn .22s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 16, color: C.txt }}>
          {filtered.length} diligence{filtered.length > 1 ? 's' : ''}
        </div>
        {canSubmit && <Btn onClick={() => setModalOpen(true)} size="sm">+ Soumettre</Btn>}
      </div>

      <input
        value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Rechercher référence DIL/… ou objet…"
        style={{
          width: '100%', boxSizing: 'border-box',
          border: `1.5px solid ${C.bord}`, borderRadius: 10, padding: '9px 14px',
          fontSize: 13, fontFamily: 'Inter, sans-serif', marginBottom: 10, outline: 'none',
        }}
      />

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 10 }}>
        {STATUT_FILTRES.map(f => (
          <button key={f.v} onClick={() => setFiltre(f.v)} style={{
            whiteSpace: 'nowrap', padding: '5px 12px', borderRadius: 18, fontSize: 12, fontWeight: 600,
            border: `1.5px solid ${filtre === f.v ? C.vert : C.bord}`,
            background: filtre === f.v ? C.vertL : C.blanc,
            color: filtre === f.v ? C.vert : C.sec, cursor: 'pointer',
          }}>
            {f.l}
          </button>
        ))}
      </div>

      <YearMonthFilter year={year} setYear={setYear} month={month} setMonth={setMonth} />

      {filtered.length === 0
        ? <EmptyState icon="◎" title="Aucune diligence" sub="Modifiez les filtres pour voir plus de résultats." />
        : filtered.map(d => <DilCard key={d.id} d={d} navigate={navigate} />)
      }

      {modalOpen && (
        <SubmitModal
          diligences={diligences}
          setDiligences={setDiligences}
          courriers={courriers}
          user={user}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}

function DilCard({ d, navigate }) {
  const st = DIL_STATUTS.find(s => s.v === d.statut);
  const assignee = USERS.find(u => u.id === d.assigneA);
  const svcs = (d.serviceIds || []).map(id => SERVICES.find(s => s.id === id)?.abbr).filter(Boolean);

  return (
    <Card style={{ marginBottom: 10, cursor: 'pointer' }} onClick={() => navigate('diligence-detail', { id: d.id })}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div style={{ fontSize: 10, color: C.sec, fontFamily: 'monospace' }}>{d.reference}</div>
        {st && <Badge l={st.l} bg={st.bg} c={st.c} />}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.txt, marginBottom: 8, lineHeight: 1.4 }}>{d.intitule}</div>
      <PBar v={d.progression} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {assignee && <Av u={assignee} sz={24} />}
          <span style={{ fontSize: 11, color: C.sec }}>{assignee ? `${assignee.prenom} ${assignee.nom}` : '—'}</span>
        </div>
        <div style={{ fontSize: 11, color: C.sec }}>📅 {fmtDate(d.echeance)}</div>
      </div>
      {svcs.length > 0 && (
        <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {svcs.map(a => <Badge key={a} l={a} bg={C.vertL} c={C.vert} />)}
        </div>
      )}
    </Card>
  );
}

function SubmitModal({ diligences, setDiligences, courriers, user, onClose }) {
  const [intitule, setIntitule]       = useState('');
  const [fonctionId, setFonctionId]   = useState('');
  const [serviceIds, setServiceIds]   = useState([]);
  const [dateSoumis, setDateSoumis]   = useState(today());
  const [echeance, setEcheance]       = useState('');
  const [description, setDescription] = useState('');
  const [objetDoc, setObjetDoc]       = useState('');
  const [fichierNom, setFichierNom]   = useState('');
  const [lierCourrier, setLierCourrier] = useState(false);
  const [courrierIds, setCourrierIds] = useState([]);
  const [err, setErr] = useState('');

  const roleOptions = Object.entries(ROLES_LABELS).map(([v, l]) => ({ value: v, label: l }));
  const courrierOptions = courriers.map(c => ({ value: c.id, label: `${c.reference} — ${c.objet}` }));

  const submit = () => {
    if (!intitule.trim() || !echeance) { setErr('Objet et échéance sont requis.'); return; }
    const ref = genRef('DIL', diligences.map(d => d.reference), dateSoumis);
    const newDil = {
      id: `dil${Date.now()}`, reference: ref, intitule: intitule.trim(),
      assigneA: user.id, serviceIds, statut: 'non_echu', progression: 0,
      dateSubmission: dateSoumis, echeance, description: description.trim(),
      courrierIds: lierCourrier ? courrierIds : [], objetDoc, fichierNom,
      historique: [], dateReport: null, facteursReport: null,
    };
    setDiligences(ds => [newDil, ...ds]);
    onClose();
  };

  return (
    <Modal title="Soumettre une diligence" onClose={onClose}>
      <Input label="Objet de la diligence" value={intitule} onChange={setIntitule} required />
      <Select label="Fonction de l'exécutant" value={fonctionId} onChange={setFonctionId} options={roleOptions} placeholder="Sélectionner…" />
      <MultiSelectService selected={serviceIds} onChange={setServiceIds} label="Service(s) concerné(s)" />
      <Input label="Date de soumission" value={dateSoumis} onChange={setDateSoumis} type="date" required />
      <Input label="Date d'échéance" value={echeance} onChange={setEcheance} type="date" required />
      <Textarea label="Description" value={description} onChange={setDescription} rows={3} />
      <Input label="Nature du document" value={objetDoc} onChange={setObjetDoc} />
      <UploadZone label="Téléverser un document" fichierNom={fichierNom} setFichierNom={setFichierNom} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <input type="checkbox" checked={lierCourrier} onChange={e => setLierCourrier(e.target.checked)} id="lierCou" />
        <label htmlFor="lierCou" style={{ fontSize: 13, color: C.txt }}>Lier à un courrier</label>
      </div>
      {lierCourrier && (
        <Select label="Courrier lié" value={courrierIds[0] || ''} onChange={v => setCourrierIds(v ? [v] : [])} options={courrierOptions} placeholder="Choisir un courrier…" />
      )}
      {err && <div style={{ color: C.urg, fontSize: 12, marginBottom: 10 }}>{err}</div>}
      <Btn onClick={submit} full>Soumettre la diligence</Btn>
    </Modal>
  );
}
