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
import { useStore } from '../../store';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import PBar from '../../components/ui/PBar';
import Btn from '../../components/ui/Btn';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import UploadZone from '../../components/ui/UploadZone';
import EmptyState from '../../components/ui/EmptyState';
import YearMonthFilter from '../../components/shared/YearMonthFilter';
import MultiSelectImpute from '../../components/ui/MultiSelectImpute';

const STATUT_FILTRES = [
  { v: 'non_executee', l: 'Actives' },
  { v: 'en_cours',     l: 'En cours' },
  { v: 'non_echu',     l: 'Non Échu' },
  { v: 'reportee',     l: 'Reportée' },
  { v: 'executee',     l: 'Exécutée' },
  { v: 'supprimee',    l: 'Supprimée' },
  { v: 'all',          l: 'Toutes' },
];

const FONCTION_OPTS = [
  { value: 'all',             label: 'Toutes fonctions' },
  { value: 'conseiller_tech', label: 'Conseiller' },
  { value: 'sous_directeur',  label: 'Sous-Directeur' },
  { value: 'chef_service',    label: 'Chef de service' },
];

export default function DiligencesPage({ diligences, setDiligences, courriers, user, navigate }) {
  const { users } = useStore();

  const [search, setSearch]     = useState('');
  const [filtre, setFiltre]     = useState('non_executee');
  const [fonctionF, setFonctionF] = useState('all');
  const [year, setYear]         = useState(null);
  const [month, setMonth]       = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDil, setEditing]  = useState(null);

  const initialiserFiltres = () => {
    setSearch(''); setFiltre('non_executee');
    setFonctionF('all'); setYear(null); setMonth(null);
  };

  const filtered = diligences
    .filter(d => {
      if (!matchSearch(d, search)) return false;
      if (filtre === 'non_executee' && ['executee','supprimee'].includes(d.statut)) return false;
      if (!['all','non_executee'].includes(filtre) && d.statut !== filtre) return false;
      if (year  && parseInt(d.dateSubmission?.split('-')[0]) !== year)  return false;
      if (month && parseInt(d.dateSubmission?.split('-')[1]) !== month) return false;
      if (fonctionF !== 'all') {
        const auteur = users.find(u => u.id === d.assigneA);
        if (!auteur || auteur.role !== fonctionF) return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.dateSubmission) - new Date(a.dateSubmission));

  const canSubmit = ROLES_SOUMISSION_DIL.includes(user.role);
  const canAct    = user.role !== 'secretariat';

  const handleDuplicate = async (d) => {
    const ref = genRef('DIL', diligences.map(x => x.reference), today());
    const copy = {
      ...d, id: `dil${Date.now()}`, reference: ref,
      dateSubmission: today(), historique: [],
    };
    await supabase.from('diligences').insert(diligenceToDb(copy));
    setDiligences(ds => [copy, ...ds]);
  };

  return (
    <div style={{ padding: '14px 14px 0', animation: 'pageIn .22s ease-out' }}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 16, color: C.txt }}>
          {filtered.length} diligence{filtered.length > 1 ? 's' : ''}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={initialiserFiltres}
            style={{ padding: '6px 12px', borderRadius: 9, border: `1.5px solid ${C.bord}`, background: C.blanc, color: C.sec, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            ↺ Initialiser
          </button>
          {canSubmit && <Btn onClick={() => setModalOpen(true)} size="sm">+ Soumettre</Btn>}
        </div>
      </div>

      {/* Barre de recherche */}
      <input
        value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Rechercher référence DIL/… ou objet…"
        style={{ width: '100%', boxSizing: 'border-box', border: `1.5px solid ${C.bord}`, borderRadius: 10, padding: '9px 14px', fontSize: 13, fontFamily: 'Inter, sans-serif', marginBottom: 10, outline: 'none' }}
      />

      {/* Filtres statut */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 8 }}>
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

      {/* Filtre Fonction */}
      <select
        value={fonctionF}
        onChange={e => setFonctionF(e.target.value)}
        style={{
          width: '100%', border: `1.5px solid ${C.bord}`, borderRadius: 9,
          padding: '8px 12px', fontSize: 13, marginBottom: 10, outline: 'none',
          background: C.blanc, boxSizing: 'border-box', color: C.txt,
        }}
      >
        {FONCTION_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      <YearMonthFilter year={year} setYear={setYear} month={month} setMonth={setMonth} />

      {filtered.length === 0
        ? <EmptyState icon="◎" title="Aucune diligence" sub="Modifiez les filtres ou cliquez sur Initialiser." />
        : filtered.map(d => (
          <DilCard
            key={d.id}
            d={d}
            users={users}
            canAct={canAct}
            isAdmin={user.role === 'admin'}
            navigate={navigate}
            onEdit={() => setEditing(d)}
            onDuplicate={() => handleDuplicate(d)}
            setDiligences={setDiligences}
          />
        ))
      }

      {modalOpen && (
        <SubmitModal diligences={diligences} setDiligences={setDiligences} courriers={courriers} user={user} onClose={() => setModalOpen(false)} />
      )}
      {editingDil && (
        <EditModal diligence={editingDil} setDiligences={setDiligences} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

/* ── Carte Diligence ── */
function DilCard({ d, users, canAct, isAdmin, navigate, onEdit, onDuplicate, setDiligences }) {
  const [deleting, setDeleting] = useState(false);
  const st = DIL_STATUTS.find(s => s.v === d.statut);
  const imputeList = Array.isArray(d.imputeA) ? d.imputeA : (d.imputeA ? [d.imputeA] : []);

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Supprimer définitivement cette diligence ?')) return;
    setDeleting(true);
    await supabase.from('diligences').delete().eq('id', d.id);
    setDiligences(ds => ds.filter(x => x.id !== d.id));
  };

  return (
    <Card style={{ marginBottom: 12 }}>
      {/* En-tête carte */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div style={{ fontSize: 10, color: C.sec, fontFamily: 'monospace' }}>{d.reference}</div>
        {st && <Badge l={st.l} bg={st.bg} c={st.c} />}
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, color: C.txt, marginBottom: 8, lineHeight: 1.4 }}>{d.intitule}</div>

      {/* Barre de progression */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <span style={{ fontSize: 10, color: C.sec }}>Taux de réalisation</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.vert }}>{d.progression ?? 0}%</span>
        </div>
        <PBar v={d.progression ?? 0} />
      </div>

      {/* Imputée à */}
      {imputeList.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
          {imputeList.map(v => (
            <span key={v} style={{ background: C.coursB, color: C.cours, borderRadius: 8, padding: '2px 7px', fontSize: 10, fontWeight: 600 }}>{v}</span>
          ))}
        </div>
      )}

      <div style={{ fontSize: 11, color: C.sec, marginBottom: 10 }}>📅 Échéance : {fmtDate(d.echeance)}</div>

      {/* Boutons d'action */}
      {canAct && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <ActionBtn label="👁 Afficher" color={C.cours} bg={C.coursB} onClick={() => navigate('diligence-detail', { id: d.id })} />
          <ActionBtn label="✏️ Modifier" color={C.vert} bg={C.vertL} onClick={onEdit} />
          <ActionBtn label="⧉ Dupliquer" color={C.orng} bg={C.orngL} onClick={onDuplicate} />
          {isAdmin && (
            <ActionBtn label={deleting ? '…' : '🗑️'} color={C.urg} bg="#FEF2F2" onClick={handleDelete} />
          )}
        </div>
      )}
    </Card>
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

/* ── Modal Soumettre ── */
function SubmitModal({ diligences, setDiligences, courriers, user, onClose }) {
  const [intitule, setIntitule]       = useState('');
  const [imputeA, setImputeA]         = useState([]);
  const [statut, setStatut]           = useState('non_echu');
  const [progression, setProgression] = useState(0);
  const [dateSoumis, setDateSoumis]   = useState(today());
  const [echeance, setEcheance]       = useState('');
  const [description, setDescription] = useState('');
  const [objetDoc, setObjetDoc]       = useState('');
  const [fichierNom, setFichierNom]   = useState('');
  const [saving, setSaving]           = useState(false);
  const [err, setErr]                 = useState('');

  const statutOpts = DIL_STATUTS.map(s => ({ value: s.v, label: s.l }));

  const submit = async () => {
    if (!intitule.trim() || !echeance) { setErr('Objet et échéance sont requis.'); return; }
    setSaving(true);
    const ref = genRef('DIL', diligences.map(d => d.reference), dateSoumis);
    const newDil = {
      id: `dil${Date.now()}`, reference: ref, intitule: intitule.trim(),
      assigneA: user.id, serviceIds: [], imputeA,
      statut, progression: Number(progression),
      dateSubmission: dateSoumis, echeance, description: description.trim(),
      courrierIds: [], objetDoc, fichierNom,
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
      <MultiSelectImpute label="Imputée à" selected={imputeA} onChange={setImputeA} options={IMPUTE_OPTIONS} placeholder="Choisir…" />
      <Select label="Statut" value={statut} onChange={setStatut} options={statutOpts} required />
      <Input label="Date de soumission" value={dateSoumis} onChange={setDateSoumis} type="date" required />

      {/* Taux de réalisation */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.sec, marginBottom: 4 }}>
          Taux de réalisation : <span style={{ color: C.vert, fontWeight: 800 }}>{progression}%</span>
        </label>
        <input
          type="range" min={0} max={100} value={progression}
          onChange={e => setProgression(e.target.value)}
          style={{ width: '100%', accentColor: C.vert }}
        />
      </div>

      <Input label="Date d'échéance" value={echeance} onChange={setEcheance} type="date" required />
      <Textarea label="Description" value={description} onChange={setDescription} rows={3} />
      <Input label="Nature du document" value={objetDoc} onChange={setObjetDoc} />
      <UploadZone label="Téléverser un document" fichierNom={fichierNom} setFichierNom={setFichierNom} />

      {/* Lier à un courrier — désactivé */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, opacity: 0.4 }}>
        <input type="checkbox" disabled id="lierCouDis" />
        <label htmlFor="lierCouDis" style={{ fontSize: 13, color: C.sec }}>Lier à un courrier (désactivé)</label>
      </div>

      {err && <div style={{ color: C.urg, fontSize: 12, marginBottom: 10 }}>{err}</div>}
      <Btn onClick={submit} full disabled={saving}>{saving ? 'Enregistrement…' : 'Soumettre la diligence'}</Btn>
    </Modal>
  );
}

/* ── Modal Modifier (inline depuis la liste) ── */
function EditModal({ diligence, setDiligences, onClose }) {
  const [intitule, setIntitule] = useState(diligence.intitule);
  const [imputeA, setImputeA]   = useState(Array.isArray(diligence.imputeA) ? diligence.imputeA : []);
  const [echeance, setEcheance] = useState(diligence.echeance || '');
  const [description, setDesc]  = useState(diligence.description || '');
  const [statut, setStatut]     = useState(diligence.statut);
  const [progression, setProg]  = useState(diligence.progression ?? 0);
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState('');

  const save = async () => {
    if (!intitule.trim()) { setErr("L'objet est requis."); return; }
    setSaving(true);
    const updates = {
      intitule: intitule.trim(), impute_a: imputeA, echeance,
      description, statut, progression: Number(progression),
    };
    await supabase.from('diligences').update(updates).eq('id', diligence.id);
    setDiligences(ds => ds.map(d => d.id === diligence.id
      ? { ...d, intitule: intitule.trim(), imputeA, echeance, description, statut, progression: Number(progression) }
      : d));
    setSaving(false);
    onClose();
  };

  return (
    <Modal title="Modifier la diligence" sub={diligence.reference} onClose={onClose}>
      <Input label="Objet de la diligence" value={intitule} onChange={setIntitule} required />
      <MultiSelectImpute label="Imputée à" selected={imputeA} onChange={setImputeA} options={IMPUTE_OPTIONS} placeholder="Choisir…" />
      <Select label="Statut" value={statut} onChange={setStatut} options={DIL_STATUTS.map(s => ({ value: s.v, label: s.l }))} required />
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.sec, marginBottom: 4 }}>
          Taux de réalisation : <span style={{ color: C.vert, fontWeight: 800 }}>{progression}%</span>
        </label>
        <input type="range" min={0} max={100} value={progression} onChange={e => setProg(e.target.value)} style={{ width: '100%', accentColor: C.vert }} />
      </div>
      <Input label="Date d'échéance" value={echeance} onChange={setEcheance} type="date" />
      <Textarea label="Description" value={description} onChange={setDesc} rows={3} />
      {err && <div style={{ color: C.urg, fontSize: 12, marginBottom: 10 }}>{err}</div>}
      <Btn onClick={save} full disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer les modifications'}</Btn>
    </Modal>
  );
}
