import { useState } from 'react';
import { C } from '../../constants/colors';
import { SERVICES } from '../../constants/services';
import { ROLES_LABELS, ROLES_COURRIER_RECU } from '../../constants/roles';
import { CORR_EMIS_STATUTS, CORR_RECU_STATUTS } from '../../constants/statuts';
import { fmtDate, today } from '../../utils/dates';
import { matchSearch } from '../../utils/search';
import { genRef } from '../../utils/refs';
import { supabase } from '../../lib/supabase';
import { courrierToDb } from '../../lib/mappers';
import { useStore } from '../../store';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Btn from '../../components/ui/Btn';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import UploadZone from '../../components/ui/UploadZone';
import EmptyState from '../../components/ui/EmptyState';

const FILTRES = [
  { v: 'all',     l: 'Tous' },
  { v: 'recu',    l: 'Reçus' },
  { v: 'emis',    l: 'Émis' },
  { v: 'urgents', l: 'Urgents (>10j)' },
];

export default function CourriersPage({ courriers, setCourriers, user, navigate }) {
  const [search, setSearch]   = useState('');
  const [filtre, setFiltre]   = useState('all');
  const [modal, setModal]     = useState(false);

  const showStats = ['secretariat','directeur','admin'].includes(user.role);
  const total   = courriers.length;
  const enCours = courriers.filter(c => ['en_attente','en_cours_redaction','attente_signature'].includes(c.statut)).length;
  const urgents = courriers.filter(c => c.joursAttente > 10).length;
  const resolus = courriers.filter(c => ['repondu','signe_transmis'].includes(c.statut)).length;

  const filtered = courriers
    .filter(c => {
      if (!matchSearch(c, search)) return false;
      if (filtre === 'recu'    && c.sens !== 'recu')   return false;
      if (filtre === 'emis'    && c.sens !== 'emis')   return false;
      if (filtre === 'urgents' && c.joursAttente <= 10) return false;
      return true;
    })
    .sort((a, b) => new Date(b.dateEmission) - new Date(a.dateEmission));

  return (
    <div style={{ padding: '14px 14px 0', animation: 'pageIn .22s ease-out' }}>
      {showStats && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
          <StatBox label="Total"    value={total}   color={C.cours} />
          <StatBox label="En cours" value={enCours} color={C.orng} />
          <StatBox label="Urgents"  value={urgents} color={C.urg} />
          <StatBox label="Résolus"  value={resolus} color={C.ok} />
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 16, color: C.txt }}>
          {filtered.length} courrier{filtered.length > 1 ? 's' : ''}
        </div>
        <Btn onClick={() => setModal(true)} size="sm">+ Nouveau</Btn>
      </div>

      <input
        value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Rechercher référence COU/… ou objet…"
        style={{ width: '100%', boxSizing: 'border-box', border: `1.5px solid ${C.bord}`, borderRadius: 10, padding: '9px 14px', fontSize: 13, fontFamily: 'Inter, sans-serif', marginBottom: 10, outline: 'none' }}
      />

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 12 }}>
        {FILTRES.map(f => (
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

      {filtered.length === 0
        ? <EmptyState icon="✉️" title="Aucun courrier" />
        : filtered.map(c => <CourrierCard key={c.id} c={c} navigate={navigate} />)
      }

      {modal && <NewCourrierModal courriers={courriers} setCourriers={setCourriers} user={user} onClose={() => setModal(false)} />}
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div style={{ background: C.blanc, borderRadius: 10, padding: '10px 8px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
      <div style={{ fontSize: 20, fontWeight: 900, fontFamily: 'Nunito', color }}>{value}</div>
      <div style={{ fontSize: 10, color: C.sec, fontWeight: 600 }}>{label}</div>
    </div>
  );
}

function CourrierCard({ c, navigate }) {
  const st = [...CORR_EMIS_STATUTS, ...CORR_RECU_STATUTS].find(s => s.v === c.statut);
  return (
    <Card style={{ marginBottom: 10, cursor: 'pointer' }} onClick={() => navigate('courrier-detail', { id: c.id })}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: c.sens === 'recu' ? C.cours : C.vert }}>
            {c.sens === 'recu' ? '📥 Reçu' : '📤 Émis'}
          </span>
          <span style={{ fontSize: 10, color: C.sec, fontFamily: 'monospace' }}>{c.reference}</span>
        </div>
        {st && <Badge l={st.l} bg={st.bg} c={st.c} />}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.txt, marginBottom: 4, lineHeight: 1.4 }}>{c.objet}</div>
      <div style={{ fontSize: 11, color: C.sec }}>
        {c.partenaire} · {fmtDate(c.dateEmission)}
        {c.joursAttente > 10 && <span style={{ color: C.urg, marginLeft: 6 }}>⚠️ {c.joursAttente}j</span>}
      </div>
    </Card>
  );
}

function NewCourrierModal({ courriers, setCourriers, user, onClose }) {
  const { users } = useStore();
  const [sens, setSens]             = useState('recu');
  const [objet, setObjet]           = useState('');
  const [partenaire, setPartenaire] = useState('');
  const [structureEm, setStructEm]  = useState('');
  const [serviceEmId, setServiceEm] = useState('');
  const [assigneId, setAssigneId]   = useState('');
  const [dateEm, setDateEm]         = useState(today());
  const [corps, setCorps]           = useState('');
  const [fichierNom, setFichierNom] = useState('');
  const [saving, setSaving]         = useState(false);
  const [err, setErr] = useState('');

  const canCreateRecu  = ROLES_COURRIER_RECU.includes(user.role) || user.role === 'admin';
  const serviceOptions = SERVICES.map(s => ({ value: s.id, label: `${s.abbr} — ${s.nom.substring(0, 30)}…` }));
  const userOptions    = (users.length ? users : []).filter(u => u.statut === 'actif').map(u => ({ value: u.id, label: `${u.prenom} ${u.nom} (${ROLES_LABELS[u.role]})` }));

  const submit = async () => {
    if (!objet.trim() || !partenaire.trim()) { setErr('Objet et partenaire sont requis.'); return; }
    setSaving(true);
    const ref = genRef('COU', courriers.map(c => c.reference), dateEm);
    const newC = {
      id: `c${Date.now()}`, reference: ref, sens, objet: objet.trim(),
      partenaire: partenaire.trim(), structureEmettrice: structureEm,
      statut: sens === 'recu' ? 'en_attente' : 'en_cours_redaction',
      joursAttente: 0, serviceEmetteurId: serviceEmId,
      assigneARoleId: sens === 'recu' ? assigneId : null,
      corps: corps.trim(), noteInterne: '', relances: [],
      dateEmission: dateEm, objetDoc: '', fichierNom,
    };
    await supabase.from('courriers').insert(courrierToDb(newC));
    setCourriers(cs => [newC, ...cs]);
    setSaving(false);
    onClose();
  };

  return (
    <Modal title="Nouveau courrier" onClose={onClose}>
      {canCreateRecu && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {['recu','emis'].map(s => (
            <button key={s} onClick={() => setSens(s)} style={{
              flex: 1, padding: '8px 0', borderRadius: 9, fontWeight: 700, fontSize: 13,
              border: `2px solid ${sens === s ? C.vert : C.bord}`,
              background: sens === s ? C.vertL : C.blanc,
              color: sens === s ? C.vert : C.sec, cursor: 'pointer',
            }}>
              {s === 'recu' ? '📥 Reçu' : '📤 Émis'}
            </button>
          ))}
        </div>
      )}
      <Input label="Objet" value={objet} onChange={setObjet} required />
      <Input label="Structure partenaire" value={partenaire} onChange={setPartenaire} required />
      {sens === 'recu' && <Input label="Structure émettrice" value={structureEm} onChange={setStructEm} />}
      {sens === 'emis' && <Select label="Service émetteur" value={serviceEmId} onChange={setServiceEm} options={serviceOptions} placeholder="Choisir un service…" />}
      {sens === 'recu' && <Select label="Imputer à" value={assigneId} onChange={setAssigneId} options={userOptions} placeholder="Choisir un agent…" />}
      <Input label="Date" value={dateEm} onChange={setDateEm} type="date" required />
      <Textarea label="Corps du courrier" value={corps} onChange={setCorps} rows={3} />
      <UploadZone label="Document joint" fichierNom={fichierNom} setFichierNom={setFichierNom} />
      {err && <div style={{ color: C.urg, fontSize: 12, marginBottom: 10 }}>{err}</div>}
      <Btn onClick={submit} full disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer le courrier'}</Btn>
    </Modal>
  );
}
