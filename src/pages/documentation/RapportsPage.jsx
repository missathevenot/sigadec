import { useState } from 'react';
import { C } from '../../constants/colors';
import { SERVICES } from '../../constants/services';
import { fmtDate, today } from '../../utils/dates';
import { matchSearch } from '../../utils/search';
import { genRef, isoWeek } from '../../utils/refs';
import { supabase } from '../../lib/supabase';
import { rapportToDb } from '../../lib/mappers';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Btn from '../../components/ui/Btn';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import UploadZone from '../../components/ui/UploadZone';
import EmptyState from '../../components/ui/EmptyState';
import YearMonthFilter from '../../components/shared/YearMonthFilter';
import { MOIS_NOMS } from '../../constants/mois';

const TYPES = [
  { label: 'Autre',                                   prefix: 'DOC', autre: true },
  { label: "Commentaire de la Charte d'Ethique",      prefix: 'CHA' },
  { label: 'Compte-rendu de réunion du comité',       prefix: 'CR' },
  { label: "Note d'information",                      prefix: 'NINF' },
  { label: 'Note de service',                         prefix: 'NSER' },
  { label: "Rapport d'activités annuel",              prefix: 'RAA' },
  { label: "Rapport d'activités semestriel",          prefix: 'RAS' },
  { label: "Rapport d'activités trimestriel",         prefix: 'RAT' },
  { label: 'Rapport de mission',                      prefix: 'RAM' },
  { label: 'Rapport hebdomadaire de service',         prefix: 'RHE', hebdo: true },
];

export default function RapportsPage({ rapports, setRapports, user }) {
  const [search, setSearch]   = useState('');
  const [typeF, setTypeF]     = useState('');
  const [year, setYear]       = useState(null);
  const [month, setMonth]     = useState(null);
  const [svcView, setSvcView] = useState(null);
  const [modalOpen, setModal] = useState(false);

  const filtered = rapports
    .filter(r => {
      if (!matchSearch(r, search)) return false;
      if (typeF && r.type !== typeF) return false;
      if (year && r.annee !== year) return false;
      if (month && r.moisDoc !== month) return false;
      if (svcView && r.serviceId !== svcView) return false;
      return true;
    })
    .sort((a, b) => new Date(b.dateSubmission) - new Date(a.dateSubmission));

  const typeOptions = [{ value: '', label: 'Tous les types' }, ...TYPES.map(t => ({ value: t.label, label: t.label }))];

  return (
    <div style={{ padding: '14px 14px 0', animation: 'pageIn .22s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 16, color: C.txt }}>
          {filtered.length} document{filtered.length > 1 ? 's' : ''}
        </div>
        <Btn onClick={() => setModal(true)} size="sm">+ Déposer</Btn>
      </div>

      <input
        value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Rechercher référence ou objet…"
        style={{
          width: '100%', boxSizing: 'border-box',
          border: `1.5px solid ${C.bord}`, borderRadius: 10, padding: '9px 14px',
          fontSize: 13, fontFamily: 'Inter, sans-serif', marginBottom: 10, outline: 'none',
        }}
      />

      <select
        value={typeF} onChange={e => setTypeF(e.target.value)}
        style={{
          width: '100%', border: `1.5px solid ${C.bord}`, borderRadius: 9,
          padding: '9px 12px', fontSize: 13, marginBottom: 10, outline: 'none',
          background: C.blanc, boxSizing: 'border-box',
        }}
      >
        {typeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      <YearMonthFilter year={year} setYear={setYear} month={month} setMonth={setMonth} />

      {/* Grille services 2×2 */}
      {!svcView ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          {SERVICES.slice(0, 8).map(s => (
            <div key={s.id} onClick={() => setSvcView(s.id)} style={{
              background: C.blanc, borderRadius: 12, padding: '12px', cursor: 'pointer',
              boxShadow: '0 1px 5px rgba(0,0,0,.05)', textAlign: 'center',
            }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: C.vert }}>{s.abbr}</div>
              <div style={{ fontSize: 10, color: C.sec, marginTop: 4 }}>
                {rapports.filter(r => r.serviceId === s.id).length} doc(s)
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ marginBottom: 10 }}>
          <button onClick={() => setSvcView(null)} style={{ background: 'none', border: 'none', color: C.vert, fontWeight: 700, cursor: 'pointer', fontSize: 13, marginBottom: 10 }}>
            ← Tous les services
          </button>
          <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 14, color: C.txt, marginBottom: 10 }}>
            {SERVICES.find(s => s.id === svcView)?.abbr}
          </div>
        </div>
      )}

      {filtered.length === 0
        ? <EmptyState icon="📄" title="Aucun document" sub="Déposez un premier document." />
        : filtered.map(r => (
          <Card key={r.id} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div style={{ fontSize: 10, color: C.sec, fontFamily: 'monospace' }}>{r.reference}</div>
              <Badge l={r.type.split(' ').slice(0,2).join(' ')} bg={C.coursB} c={C.cours} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.txt, marginBottom: 4, lineHeight: 1.4 }}>{r.objet || r.titre}</div>
            <div style={{ fontSize: 11, color: C.sec }}>
              {SERVICES.find(s => s.id === r.serviceId)?.abbr} · {r.auteur} · {fmtDate(r.dateSubmission)}
            </div>
            {r.resume && <div style={{ fontSize: 12, color: C.sec, marginTop: 4 }}>{r.resume}</div>}
          </Card>
        ))
      }

      {modalOpen && <DeposeModal rapports={rapports} setRapports={setRapports} user={user} onClose={() => setModal(false)} />}
    </div>
  );
}

function DeposeModal({ rapports, setRapports, user, onClose }) {
  const [objet, setObjet]         = useState('');
  const [dateSoumis, setDate]     = useState(today());
  const [type, setType]           = useState('');
  const [moisDoc, setMoisDoc]     = useState(String(new Date().getMonth() + 1));
  const [serviceId, setServiceId] = useState(user.serviceId || '');
  const [semaine, setSemaine]     = useState(String(isoWeek(new Date())));
  const [resume, setResume]       = useState('');
  const [fichierNom, setFich]     = useState('');
  const [saving, setSaving]       = useState(false);
  const [err, setErr] = useState('');

  const typeObj    = TYPES.find(t => t.label === type);
  const isHebdo    = typeObj?.hebdo;
  const annee      = new Date().getFullYear();
  const serviceOpts = SERVICES.map(s => ({ value: s.id, label: `${s.abbr} — ${s.nom.substring(0, 30)}…` }));
  const moisOpts    = MOIS_NOMS.map((m, i) => ({ value: String(i + 1), label: m }));
  const typeOpts    = TYPES.map(t => ({ value: t.label, label: t.label }));

  const prefix    = typeObj?.prefix || 'DOC';
  const previewRef = genRef(prefix, rapports.map(r => r.reference), dateSoumis);

  const submit = async () => {
    if (!objet.trim() || !type || !serviceId) { setErr('Objet, type et service sont requis.'); return; }
    setSaving(true);
    const newR = {
      id: `r${Date.now()}`, reference: previewRef,
      objet: objet.trim(), titre: objet.trim(), type,
      serviceId, annee, semaine: isHebdo ? Number(semaine) : null,
      moisDoc: Number(moisDoc), auteur: `${user.prenom} ${user.nom}`,
      resume: resume.trim(), dateSubmission: dateSoumis,
      createdAt: new Date().toISOString(),
    };
    await supabase.from('rapports').insert(rapportToDb(newR));
    setRapports(rs => [newR, ...rs]);
    setSaving(false);
    onClose();
  };

  return (
    <Modal title="Déposer un document" onClose={onClose}>
      <Input label="Objet du document" value={objet} onChange={setObjet} required />
      <Input label="Date de soumission" value={dateSoumis} onChange={setDate} type="date" required />
      <Select label="Type" value={type} onChange={setType} options={typeOpts} placeholder="Choisir un type…" required />
      <Select label="Mois" value={moisDoc} onChange={setMoisDoc} options={moisOpts} />
      <Select label="Service" value={serviceId} onChange={setServiceId}
        options={user.role === 'chef_service' && user.serviceId
          ? serviceOpts.filter(o => o.value === user.serviceId)
          : serviceOpts}
        required placeholder="Choisir un service…" />
      <Input label="Année" value={String(annee)} onChange={() => {}} disabled />
      {isHebdo && <Input label="N° semaine" value={semaine} onChange={setSemaine} type="number" />}
      <Textarea label="Résumé" value={resume} onChange={setResume} rows={2} />
      <div style={{ fontSize: 11, color: C.sec, marginBottom: 12, fontFamily: 'monospace' }}>
        Référence : {previewRef}
      </div>
      <UploadZone label="Fichier" fichierNom={fichierNom} setFichierNom={setFich} />
      {err && <div style={{ color: C.urg, fontSize: 12, marginBottom: 10 }}>{err}</div>}
      <Btn onClick={submit} full disabled={saving}>{saving ? 'Enregistrement…' : 'Déposer le document'}</Btn>
    </Modal>
  );
}
