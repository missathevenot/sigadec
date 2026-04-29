import { useState } from 'react';
import { C } from '../../constants/colors';
import { DIL_STATUTS } from '../../constants/statuts';
import { IMPUTE_OPTIONS } from '../../constants/imputation';
import { ROLES_SOUMISSION_DIL } from '../../constants/roles';
import { fmtDate, today } from '../../utils/dates';
import { matchSearch } from '../../utils/search';
import { genRef } from '../../utils/refs';
import { supabase } from '../../lib/supabase';
import { diligenceToDb } from '../../lib/mappers';
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
import EmptyState from '../../components/ui/EmptyState';
import YearMonthFilter from '../../components/shared/YearMonthFilter';
import { useStore } from '../../store';

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
  const { users } = useStore();
  const [search, setSearch]       = useState('');
  const [filtre, setFiltre]       = useState('non_executee');
  const [year, setYear]           = useState(null);
  const [month, setMonth]         = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = diligences
    .filter(d => {
      if (!matchSearch(d, search)) return false;
      if (filtre === 'non_executee' && ['executee','supprimee'].includes(d.statut)) return false;
      if (!['all','non_executee'].includes(filtre) && d.statut !== filtre) return false;
      if (year  && parseInt(d.dateSubmission?.split('-')[0]) !== year)  return false;
      if (month && parseInt(d.dateSubmission?.split('-')[1]) !== month) return false;
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
        style={{ width: '100%', boxSizing: 'border-box', border: `1.5px solid ${C.bord}`, borderRadius: 10, padding: '9px 14px', fontSize: 13, fontFamily: 'Inter, sans-serif', marginBottom: 10, outline: 'none' }}
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
        ? <EmptyState icon="◎" title="Aucune diligence" sub="Modifiez les filtres." />
        : filtered.map(d => <DilCard key={d.id} d={d} users={users} navigate={navigate} />)
      }

      {modalOpen && (
        <SubmitModal diligences={diligences} setDiligences={setDiligences} courriers={courriers} user={user} onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
}

function DilCard({ d, users, navigate }) {
  const st = DIL_STATUTS.find(s => s.v === d.statut);

  return (
    <Card style={{ marginBottom: 10, cursor: 'pointer' }} onClick={() => navigate('diligence-detail', { id: d.id })}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div style={{ fontSize: 10, color: C.sec, fontFamily: 'monospace' }}>{d.reference}</div>
        {st && <Badge l={st.l} bg={st.bg} c={st.c} />}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.txt, marginBottom: 8, lineHeight: 1.4 }}>{d.intitule}</div>

      {/* Barre de progression */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <span style={{ fontSize: 10, color: C.sec }}>Taux de réalisation</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.vert }}>{d.progression ?? 0}%</span>
        </div>
        <PBar v={d.progression ?? 0} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
        <div style={{ fontSize: 11, color: C.sec }}>
          {d.imputeA ? <span style={{ color: C.cours, fontWeight: 600 }}>{d.imputeA}</span> : '—'}
        </div>
        <div style={{ fontSize: 11, color: C.sec }}>📅 {fmtDate(d.echeance)}</div>
      </div>
    </Card>
  );
}

function SubmitModal({ diligences, setDiligences, courriers, user, onClose }) {
  const [intitule, setIntitule]       = useState('');
  const [imputeA, setImputeA]         = useState('');
  const [statut, setStatut]           = useState('non_echu');
  const [dateSoumis, setDateSoumis]   = useState(today());
  const [echeance, setEcheance]       = useState('');
  const [description, setDescription] = useState('');
  const [objetDoc, setObjetDoc]       = useState('');
  const [fichierNom, setFichierNom]   = useState('');
  const [lierCourrier, setLier]       = useState(false);
  const [courrierIds, setCouIds]      = useState([]);
  const [saving, setSaving]           = useState(false);
  const [err, setErr]                 = useState('');

  const courrierOptions = courriers.map(c => ({ value: c.id, label: `${c.reference} — ${c.objet}` }));
  const statutOpts      = DIL_STATUTS.map(s => ({ value: s.v, label: s.l }));

  const submit = async () => {
    if (!intitule.trim() || !echeance) { setErr('Objet et échéance sont requis.'); return; }
    setSaving(true);
    const ref = genRef('DIL', diligences.map(d => d.reference), dateSoumis);
    const newDil = {
      id: `dil${Date.now()}`, reference: ref, intitule: intitule.trim(),
      assigneA: user.id, serviceIds: [], imputeA,
      statut, progression: 0,
      dateSubmission: dateSoumis, echeance, description: description.trim(),
      courrierIds: lierCourrier ? courrierIds : [], objetDoc, fichierNom,
      historique: [], dateReport: null, facteursReport: null,
    };
    await supabase.from('diligences').insert(diligenceToDb(newDil));
    setDiligences(ds => [newDil, ...ds]);
    setSaving(false);
    onClose();
  };

  return (
    <Modal title="Soumettre une diligence" onClose={onClose}>
      <Input label="Objet de la diligence" value={intitule} onChange={setIntitule} required />
      <Select label="Imputée à" value={imputeA} onChange={setImputeA} options={IMPUTE_OPTIONS} placeholder="Choisir…" />
      <Select label="Statut" value={statut} onChange={setStatut} options={statutOpts} required />
      <Input label="Date de soumission" value={dateSoumis} onChange={setDateSoumis} type="date" required />
      <Input label="Date d'échéance" value={echeance} onChange={setEcheance} type="date" required />
      <Textarea label="Description" value={description} onChange={setDescription} rows={3} />
      <Input label="Nature du document" value={objetDoc} onChange={setObjetDoc} />
      <UploadZone label="Téléverser un document" fichierNom={fichierNom} setFichierNom={setFichierNom} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <input type="checkbox" checked={lierCourrier} onChange={e => setLier(e.target.checked)} id="lierCou" />
        <label htmlFor="lierCou" style={{ fontSize: 13, color: C.txt }}>Lier à un courrier</label>
      </div>
      {lierCourrier && <Select label="Courrier lié" value={courrierIds[0] || ''} onChange={v => setCouIds(v ? [v] : [])} options={courrierOptions} placeholder="Choisir un courrier…" />}
      {err && <div style={{ color: C.urg, fontSize: 12, marginBottom: 10 }}>{err}</div>}
      <Btn onClick={submit} full disabled={saving}>{saving ? 'Enregistrement…' : 'Soumettre la diligence'}</Btn>
    </Modal>
  );
}
