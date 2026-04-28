import { useState } from 'react';
import { C } from '../../constants/colors';
import { USERS } from '../../constants/users';
import { INFO_STATUTS } from '../../constants/statuts';
import { fmtDate, today } from '../../utils/dates';
import { matchSearch } from '../../utils/search';
import { genRef } from '../../utils/refs';
import { supabase } from '../../lib/supabase';
import { infoToDb } from '../../lib/mappers';
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
import MultiSelectService from '../../components/ui/MultiSelectService';

export default function InfosPage({ infos, setInfos, user }) {
  const { users } = useStore();
  const [search, setSearch]     = useState('');
  const [filtre, setFiltre]     = useState('all');
  const [modalOpen, setModal]   = useState(false);

  const filtered = infos
    .filter(i => {
      const s = search.toLowerCase();
      if (s && !(i.reference || '').toLowerCase().includes(s) && !(i.titre || '').toLowerCase().includes(s)) return false;
      if (filtre !== 'all' && i.statut !== filtre) return false;
      return true;
    })
    .sort((a, b) => new Date(b.dateSubmission) - new Date(a.dateSubmission));

  return (
    <div style={{ padding: '14px 14px 0', animation: 'pageIn .22s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 16, color: C.txt }}>
          {filtered.length} info{filtered.length > 1 ? 's' : ''}
        </div>
        <Btn onClick={() => setModal(true)} size="sm">+ Ajouter</Btn>
      </div>

      <input
        value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Rechercher référence INFO/… ou objet…"
        style={{ width: '100%', boxSizing: 'border-box', border: `1.5px solid ${C.bord}`, borderRadius: 10, padding: '9px 14px', fontSize: 13, fontFamily: 'Inter, sans-serif', marginBottom: 10, outline: 'none' }}
      />

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 12 }}>
        {[{ v: 'all', l: 'Toutes' }, ...INFO_STATUTS].map(f => (
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
        ? <EmptyState icon="📋" title="Aucune information" />
        : filtered.map(inf => {
            const st     = INFO_STATUTS.find(s => s.v === inf.statut);
            const auteur = (users.length ? users : USERS).find(u => u.id === inf.auteurId);
            return (
              <Card key={inf.id} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ fontSize: 10, color: C.sec, fontFamily: 'monospace' }}>{inf.reference}</div>
                  {st && <Badge l={st.l} bg={st.bg} c={st.c} />}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.txt, marginBottom: 6, lineHeight: 1.4 }}>{inf.titre}</div>
                {inf.description && <div style={{ fontSize: 12, color: C.sec, marginBottom: 6, lineHeight: 1.5 }}>{inf.description}</div>}
                <div style={{ fontSize: 11, color: C.sec }}>
                  {auteur ? `${auteur.prenom} ${auteur.nom}` : '—'} · {fmtDate(inf.dateSubmission)}
                </div>
              </Card>
            );
          })
      }

      {modalOpen && <AddInfoModal infos={infos} setInfos={setInfos} user={user} onClose={() => setModal(false)} />}
    </div>
  );
}

function AddInfoModal({ infos, setInfos, user, onClose }) {
  const [titre, setTitre]           = useState('');
  const [dateSoumis, setDateSoumis] = useState(today());
  const [statut, setStatut]         = useState('actualite');
  const [description, setDesc]      = useState('');
  const [serviceIds, setServiceIds] = useState([]);
  const [objetDoc, setObjetDoc]     = useState('');
  const [fichierNom, setFichierNom] = useState('');
  const [saving, setSaving]         = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    if (!titre.trim()) { setErr("L'objet est requis."); return; }
    setSaving(true);
    const ref = genRef('INFO', infos.map(i => i.reference), dateSoumis);
    const newInfo = {
      id: `inf${Date.now()}`, reference: ref, titre: titre.trim(),
      statut, dateSubmission: dateSoumis, date: dateSoumis,
      description: description.trim(), auteurId: user.id,
      serviceIds, dilIds: [], objetDoc, fichierNom,
    };
    await supabase.from('infos').insert(infoToDb(newInfo));
    setInfos(is => [newInfo, ...is]);
    setSaving(false);
    onClose();
  };

  return (
    <Modal title="Nouvelle information" onClose={onClose}>
      <Input label="Objet" value={titre} onChange={setTitre} required />
      <Input label="Date de soumission" value={dateSoumis} onChange={setDateSoumis} type="date" required />
      <Select label="Statut" value={statut} onChange={setStatut} options={INFO_STATUTS.map(s => ({ value: s.v, label: s.l }))} required />
      <Textarea label="Description" value={description} onChange={setDesc} rows={3} />
      <MultiSelectService selected={serviceIds} onChange={setServiceIds} label="Services destinataires" />
      <Input label="Nature du document" value={objetDoc} onChange={setObjetDoc} />
      <UploadZone label="Pièce jointe" fichierNom={fichierNom} setFichierNom={setFichierNom} />
      {err && <div style={{ color: C.urg, fontSize: 12, marginBottom: 10 }}>{err}</div>}
      <Btn onClick={submit} full disabled={saving}>{saving ? 'Enregistrement…' : "Ajouter l'information"}</Btn>
    </Modal>
  );
}
