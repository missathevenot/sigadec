import { useState } from 'react';
import { C } from '../../constants/colors';
import { canWriteEmissions, canWriteRecettes, canDeleteEmiRec } from '../../utils/access';
import { fmtDate, today } from '../../utils/dates';
import { matchSearch } from '../../utils/search';
import { genRef } from '../../utils/refs';
import { supabase } from '../../lib/supabase';
import { emissionToDb, recetteToDb } from '../../lib/mappers';
import Card from '../../components/ui/Card';
import Btn from '../../components/ui/Btn';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import UploadZone from '../../components/ui/UploadZone';
import EmptyState from '../../components/ui/EmptyState';
import YearMonthFilter from '../../components/shared/YearMonthFilter';

export default function EmiRecPage({ user, emissions, setEmissions, recettes, setRecettes }) {
  const [onglet, setOnglet]   = useState('emissions');
  const [search, setSearch]   = useState('');
  const [year, setYear]       = useState(null);
  const [month, setMonth]     = useState(null);
  const [modal, setModal]     = useState(false);
  const [editItem, setEditItem] = useState(null);

  const isEmi  = onglet === 'emissions';
  const data   = isEmi ? emissions : recettes;

  const filtered = data
    .filter(d => {
      if (!matchSearch(d, search)) return false;
      if (year  && new Date(d.date).getFullYear() !== year)  return false;
      if (month && new Date(d.date).getMonth() + 1 !== month) return false;
      return true;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Droits
  const canWrite  = isEmi ? canWriteEmissions(user) : canWriteRecettes(user);
  const canDelete = canDeleteEmiRec(user);

  const handleDelete = async (item) => {
    if (!window.confirm(`Supprimer ${isEmi ? "l'émission" : 'la recette'} « ${item.objet} » ?`)) return;
    const table = isEmi ? 'emissions' : 'recettes';
    await supabase.from(table).delete().eq('id', item.id);
    if (isEmi) setEmissions(es => es.filter(e => e.id !== item.id));
    else       setRecettes(rs => rs.filter(r => r.id !== item.id));
  };

  return (
    <div style={{ padding: '14px 14px 0', animation: 'pageIn .22s ease-out' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {[{ v:'emissions', l:'Émissions' }, { v:'recettes', l:'Recettes' }].map(t => (
          <button key={t.v} onClick={() => setOnglet(t.v)} style={{
            flex: 1, padding: '9px 0', borderRadius: 10, fontWeight: 700, fontSize: 13,
            border: `2px solid ${onglet === t.v ? C.vert : C.bord}`,
            background: onglet === t.v ? C.vertL : C.blanc,
            color: onglet === t.v ? C.vert : C.sec, cursor: 'pointer',
          }}>
            {t.l}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 16, color: C.txt }}>
          {filtered.length} entrée{filtered.length > 1 ? 's' : ''}
        </div>
        {canWrite && <Btn onClick={() => setModal(true)} size="sm">+ Ajouter</Btn>}
      </div>

      <input
        value={search} onChange={e => setSearch(e.target.value)}
        placeholder={`Rechercher ${isEmi ? 'EMI' : 'REC'}/… ou objet…`}
        style={{ width: '100%', boxSizing: 'border-box', border: `1.5px solid ${C.bord}`, borderRadius: 10, padding: '9px 14px', fontSize: 13, fontFamily: 'Inter, sans-serif', marginBottom: 10, outline: 'none' }}
      />

      <YearMonthFilter year={year} setYear={setYear} month={month} setMonth={setMonth} />

      {filtered.length === 0
        ? <EmptyState icon="💰" title={`Aucune ${isEmi ? 'émission' : 'recette'}`} />
        : filtered.map(d => (
          <Card key={d.id} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: C.sec, fontFamily: 'monospace', marginBottom: 4 }}>{d.reference}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.txt, marginBottom: 4, lineHeight: 1.4 }}>{d.objet}</div>
            {d.description && <div style={{ fontSize: 12, color: C.sec, marginBottom: 4 }}>{d.description}</div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <span style={{ fontSize: 11, color: C.sec }}>{fmtDate(d.date)}</span>
              {d.fichierNom && <span style={{ fontSize: 11, color: C.cours }}>📄 {d.fichierNom}</span>}
            </div>
            {/* Boutons édition/suppression */}
            {(canWrite || canDelete) && (
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                {canWrite && (
                  <button
                    onClick={() => setEditItem(d)}
                    style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: `1px solid ${C.vert}`, background: C.vertL, color: C.vert, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                  >
                    ✏️ Modifier
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => handleDelete(d)}
                    style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: `1px solid #FECACA`, background: '#FEF2F2', color: C.urg, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                  >
                    🗑️ Supprimer
                  </button>
                )}
              </div>
            )}
          </Card>
        ))
      }

      {modal && (
        <AddModal
          isEmi={isEmi}
          data={data}
          setData={isEmi ? setEmissions : setRecettes}
          user={user}
          onClose={() => setModal(false)}
        />
      )}
      {editItem && (
        <EditModal
          isEmi={isEmi}
          item={editItem}
          setData={isEmi ? setEmissions : setRecettes}
          onClose={() => setEditItem(null)}
        />
      )}
    </div>
  );
}

function AddModal({ isEmi, data, setData, user, onClose }) {
  const [objet, setObjet]      = useState('');
  const [date, setDate]        = useState(today());
  const [description, setDesc] = useState('');
  const [fichierNom, setFich]  = useState('');
  const [saving, setSaving]    = useState(false);
  const [err, setErr]          = useState('');

  const prefix = isEmi ? 'EMI' : 'REC';

  const submit = async () => {
    if (!objet.trim()) { setErr("L'objet est requis."); return; }
    setSaving(true);
    const ref = genRef(prefix, data.map(d => d.reference), date);
    const newEntry = {
      id: `${prefix.toLowerCase()}${Date.now()}`, reference: ref,
      objet: objet.trim(), date, description: description.trim(),
      fichierNom, auteurId: user.id,
    };
    const table = isEmi ? 'emissions' : 'recettes';
    const toDb  = isEmi ? emissionToDb : recetteToDb;
    await supabase.from(table).insert(toDb(newEntry));
    setData(ds => [newEntry, ...ds]);
    setSaving(false);
    onClose();
  };

  return (
    <Modal title={isEmi ? 'Ajouter des émissions' : 'Ajouter des recettes'} onClose={onClose}>
      <Input label="Objet" value={objet} onChange={setObjet} required />
      <Input label="Date" value={date} onChange={setDate} type="date" required />
      <Textarea label="Description" value={description} onChange={setDesc} rows={3} />
      <UploadZone label="Fichier" fichierNom={fichierNom} setFichierNom={setFich} />
      {err && <div style={{ color: C.urg, fontSize: 12, marginBottom: 10 }}>{err}</div>}
      <Btn onClick={submit} full disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Btn>
    </Modal>
  );
}

function EditModal({ isEmi, item, setData, onClose }) {
  const [objet, setObjet]      = useState(item.objet);
  const [date, setDate]        = useState(item.date);
  const [description, setDesc] = useState(item.description || '');
  const [saving, setSaving]    = useState(false);
  const [err, setErr]          = useState('');

  const save = async () => {
    if (!objet.trim()) { setErr("L'objet est requis."); return; }
    setSaving(true);
    const updates = { objet: objet.trim(), date, description };
    const table   = isEmi ? 'emissions' : 'recettes';
    await supabase.from(table).update(updates).eq('id', item.id);
    setData(ds => ds.map(d => d.id === item.id ? { ...d, objet: objet.trim(), date, description } : d));
    setSaving(false);
    onClose();
  };

  return (
    <Modal title={isEmi ? "Modifier l'émission" : 'Modifier la recette'} sub={item.reference} onClose={onClose}>
      <Input label="Objet" value={objet} onChange={setObjet} required />
      <Input label="Date" value={date} onChange={setDate} type="date" required />
      <Textarea label="Description" value={description} onChange={setDesc} rows={3} />
      {err && <div style={{ color: C.urg, fontSize: 12, marginBottom: 10 }}>{err}</div>}
      <Btn onClick={save} full disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer les modifications'}</Btn>
    </Modal>
  );
}
