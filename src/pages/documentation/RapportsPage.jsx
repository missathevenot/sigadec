import { useState } from 'react';
import { C } from '../../constants/colors';
import { SERVICES } from '../../constants/services';
import { IMPUTE_OPTIONS, SOUS_DIR_OPTIONS, SERVICE_TO_IMPUTE_VALUE, getUserImputeIds } from '../../constants/imputation';
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
import MultiSelectImpute from '../../components/ui/MultiSelectImpute';
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
  { label: 'Rapport hebdomadaire de Sous-Direction',  prefix: 'RSD', hebdo: true },
];

// Ouvre un fichier depuis le bucket 'documents' via URL signée (expire 1h)
// Fonctionne pour tous les formats : PDF, Word (.docx/.doc), Excel (.xlsx/.xls), etc.
// Le navigateur / l'OS choisit automatiquement l'application installée (Word, Excel,
// Acrobat, Adobe Reader, WPS Office, lecteur PDF intégré…)
async function openDoc(fichierNom) {
  if (!fichierNom) return;
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(fichierNom, 3600);
  if (error || !data?.signedUrl) {
    alert('Impossible d\'ouvrir ce fichier.\nVérifiez qu\'il a bien été téléversé dans le stockage.');
    return;
  }
  // Ancre dynamique : contourne les bloqueurs de pop-up et fonctionne
  // sur mobile comme sur desktop pour tous les types de fichiers
  const a = document.createElement('a');
  a.href = data.signedUrl;
  a.target = '_blank';
  a.rel   = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Détermine le libellé Auteur d'un rapport (nouveaux auteurIds ou ancien serviceId)
function getAuteurDisplay(r) {
  if (r.auteurIds?.length > 0) return r.auteurIds;
  const val = r.serviceId ? SERVICE_TO_IMPUTE_VALUE[r.serviceId] : null;
  return val ? [val] : [];
}

function typeColor(type) {
  if (!type) return { c: C.sec, bg: '#F0F2F5' };
  const t = type.toLowerCase();
  if (t.includes('charte') || t.includes('ethique')) return { c: C.violet, bg: C.violetB };
  if (t.includes('compte-rendu') || t.includes('comité')) return { c: C.vert, bg: C.vertL };
  if (t.includes("d'information") || t.includes('information')) return { c: C.cours, bg: C.coursB };
  if (t.includes('note de service')) return { c: C.cours, bg: C.coursB };
  if (t.includes('mission')) return { c: C.violet, bg: C.violetB };
  if (t.includes('hebdomadaire') || t.includes('sous-direction')) return { c: C.teal, bg: C.tealL };
  if (t.includes("d'activités") || t.includes("d'activites")) return { c: C.orng, bg: C.orngL };
  return { c: C.sec, bg: '#F0F2F5' };
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

export default function RapportsPage({ rapports, setRapports, user }) {
  const [search, setSearch]     = useState('');
  const [typeF, setTypeF]       = useState('');
  const [year, setYear]         = useState(null);
  const [month, setMonth]       = useState(null);
  const [auteurF, setAuteurF]   = useState('');
  const [sdF, setSdF]           = useState('');
  const [modalOpen, setModal]   = useState(false);
  const [viewing, setViewing]   = useState(null);
  const [editing, setEditing]   = useState(null);

  const canAct = user.role !== 'secretariat';

  const initialiser = () => {
    setSearch(''); setTypeF(''); setYear(null);
    setMonth(null); setAuteurF(''); setSdF('');
  };

  const filtered = rapports
    .filter(r => {
      if (!matchSearch(r, search)) return false;
      if (typeF && r.type !== typeF) return false;
      if (year && r.annee !== year) return false;
      if (month && r.moisDoc !== month) return false;
      if (auteurF) {
        const ids = getAuteurDisplay(r);
        if (!ids.includes(auteurF)) return false;
      }
      if (sdF) {
        if (!Array.isArray(r.sousDirIds) || !r.sousDirIds.includes(sdF)) return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.dateSubmission) - new Date(a.dateSubmission));

  const typeOptions   = [{ value: '', label: 'Tous les types' }, ...TYPES.map(t => ({ value: t.label, label: t.label }))];
  const auteurOptions = [{ value: '', label: 'Tous les auteurs' }, ...IMPUTE_OPTIONS];
  const sdOptions     = [{ value: '', label: 'Toutes les SD' }, ...SOUS_DIR_OPTIONS];

  const hasFilters = search || typeF || year || month || auteurF || sdF;

  return (
    <div style={{ padding: '14px 14px 0', animation: 'pageIn .22s ease-out' }}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 16, color: C.txt }}>
          {filtered.length} document{filtered.length > 1 ? 's' : ''}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {hasFilters && (
            <button onClick={initialiser} style={{
              padding: '6px 12px', borderRadius: 8, border: `1.5px solid ${C.vert}`,
              background: C.vertL, color: C.vert, fontWeight: 700, fontSize: 12, cursor: 'pointer',
            }}>
              ↺ Initialiser
            </button>
          )}
          <Btn onClick={() => setModal(true)} size="sm">+ Déposer</Btn>
        </div>
      </div>

      {/* Recherche */}
      <input
        value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Rechercher référence ou objet…"
        style={{
          width: '100%', boxSizing: 'border-box',
          border: `1.5px solid ${C.bord}`, borderRadius: 10, padding: '9px 14px',
          fontSize: 13, fontFamily: 'Inter, sans-serif', marginBottom: 10, outline: 'none',
        }}
      />

      {/* Filtres ligne 1 : Type + Auteur */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <select value={typeF} onChange={e => setTypeF(e.target.value)}
          style={{ border: `1.5px solid ${C.bord}`, borderRadius: 9, padding: '9px 10px', fontSize: 12, outline: 'none', background: C.blanc, boxSizing: 'border-box', width: '100%' }}>
          {typeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={auteurF} onChange={e => setAuteurF(e.target.value)}
          style={{ border: `1.5px solid ${C.bord}`, borderRadius: 9, padding: '9px 10px', fontSize: 12, outline: 'none', background: C.blanc, boxSizing: 'border-box', width: '100%' }}>
          {auteurOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Filtres ligne 2 : Sous-Direction + Année/Mois */}
      <div style={{ marginBottom: 10 }}>
        <select value={sdF} onChange={e => setSdF(e.target.value)}
          style={{ border: `1.5px solid ${C.bord}`, borderRadius: 9, padding: '9px 10px', fontSize: 12, outline: 'none', background: C.blanc, boxSizing: 'border-box', width: '100%', marginBottom: 8 }}>
          {sdOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <YearMonthFilter year={year} setYear={setYear} month={month} setMonth={setMonth} />
      </div>

      {/* Liste des documents */}
      {filtered.length === 0
        ? <EmptyState icon="📄" title="Aucun document" sub="Déposez un premier document." />
        : filtered.map(r => {
            const auteurs = getAuteurDisplay(r);
            const tc = typeColor(r.type);
            return (
              <Card key={r.id} style={{
                marginBottom: 10,
                borderLeft: `4px solid ${tc.c}`,
                background: tc.bg,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ fontSize: 10, color: C.sec, fontFamily: 'monospace' }}>{r.reference}</div>
                  <Badge l={r.type.split(' ').slice(0, 2).join(' ')} bg={tc.bg} c={tc.c} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: C.txt, marginBottom: 4, lineHeight: 1.4 }}>{r.objet || r.titre}</div>

                {/* Auteurs tags */}
                {auteurs.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
                    {auteurs.map(a => (
                      <span key={a} style={{ background: C.coursB, color: C.cours, borderRadius: 8, padding: '2px 7px', fontSize: 10, fontWeight: 600 }}>{a}</span>
                    ))}
                  </div>
                )}

                {/* Sous-Directions tags */}
                {r.sousDirIds?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
                    {r.sousDirIds.map(sd => (
                      <span key={sd} style={{ background: C.vertL, color: C.vert, borderRadius: 8, padding: '2px 7px', fontSize: 10, fontWeight: 600 }}>{sd}</span>
                    ))}
                  </div>
                )}

                <div style={{ fontSize: 11, color: C.sec, marginBottom: 6 }}>
                  {r.auteur} · {fmtDate(r.dateSubmission)}
                </div>
                {r.resume && <div style={{ fontSize: 12, color: C.sec, marginBottom: 8 }}>{r.resume}</div>}

                {/* Lien web */}
                {r.lienWeb && (
                  <a
                    href={r.lienWeb.startsWith('http') ? r.lienWeb : `https://${r.lienWeb}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      marginBottom: 8, fontSize: 11, color: C.cours, fontWeight: 600,
                      textDecoration: 'none', wordBreak: 'break-all',
                    }}
                  >
                    🔗 <span style={{ textDecoration: 'underline' }}>{r.lienWeb}</span>
                  </a>
                )}

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {canAct && <ActionBtn label="👁 Afficher"  color={C.cours} bg={C.coursB} onClick={() => setViewing(r)} />}
                  {canAct && <ActionBtn label="✏️ Modifier"  color={C.vert}  bg={C.vertL}  onClick={() => setEditing(r)} />}
                  {r.fichierNom && (
                    <ActionBtn label="📂 Ouvrir" color={C.violet || '#7C3AED'} bg={C.violetB || '#EDE9FE'}
                      onClick={() => openDoc(r.fichierNom)} />
                  )}
                  {r.lienWeb && (
                    <ActionBtn label="🔗 Accéder" color={C.cours} bg={C.coursB}
                      onClick={() => window.open(r.lienWeb.startsWith('http') ? r.lienWeb : `https://${r.lienWeb}`, '_blank', 'noopener')} />
                  )}
                </div>
              </Card>
            );
          })
      }

      {modalOpen && (
        <DeposeModal rapports={rapports} setRapports={setRapports} user={user} onClose={() => setModal(false)} />
      )}
      {viewing && (
        <ViewDocModal rapport={viewing} onClose={() => setViewing(null)} />
      )}
      {editing && (
        <EditDocModal rapport={editing} setRapports={setRapports} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

/* ── Modal Afficher ── */
function ViewDocModal({ rapport: r, onClose }) {
  const auteurs = getAuteurDisplay(r);
  return (
    <Modal title="Détail du document" sub={r.reference} onClose={onClose}>
      <VRow label="Type"           value={r.type} />
      <VRow label="Objet"          value={r.objet || r.titre} />
      <VRow label="Date"           value={fmtDate(r.dateSubmission)} />
      <VRow label="Année"          value={String(r.annee || '')} />
      {r.semaine && <VRow label="Semaine" value={String(r.semaine)} />}
      {r.moisDoc  && <VRow label="Mois"   value={MOIS_NOMS[r.moisDoc - 1] || ''} />}
      {auteurs.length > 0 && (
        <div style={{ paddingBlock: 6, borderBottom: `1px solid ${C.bord}` }}>
          <div style={{ fontSize: 12, color: C.sec, fontWeight: 600, marginBottom: 4 }}>Auteur(s)</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {auteurs.map(a => (
              <span key={a} style={{ background: C.coursB, color: C.cours, borderRadius: 8, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{a}</span>
            ))}
          </div>
        </div>
      )}
      {r.sousDirIds?.length > 0 && (
        <div style={{ paddingBlock: 6, borderBottom: `1px solid ${C.bord}` }}>
          <div style={{ fontSize: 12, color: C.sec, fontWeight: 600, marginBottom: 4 }}>Sous-Direction(s)</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {r.sousDirIds.map(sd => (
              <span key={sd} style={{ background: C.vertL, color: C.vert, borderRadius: 8, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{sd}</span>
            ))}
          </div>
        </div>
      )}
      <VRow label="Soumis par" value={r.auteur} />
      {r.resume && (
        <div style={{ paddingBlock: 6, borderBottom: `1px solid ${C.bord}` }}>
          <div style={{ fontSize: 12, color: C.sec, fontWeight: 600, marginBottom: 4 }}>Résumé</div>
          <div style={{ fontSize: 13, color: C.txt, lineHeight: 1.5 }}>{r.resume}</div>
        </div>
      )}
      {r.fichierNom && (
        <div style={{ marginTop: 12 }}>
          <button onClick={() => openDoc(r.fichierNom)} style={{
            width: '100%', padding: '10px 0', background: C.coursB, color: C.cours,
            border: `1.5px solid ${C.cours}`, borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer',
          }}>
            📂 Ouvrir le fichier : {r.fichierNom}
          </button>
        </div>
      )}
      {r.lienWeb && (
        <div style={{ marginTop: 10 }}>
          <a
            href={r.lienWeb.startsWith('http') ? r.lienWeb : `https://${r.lienWeb}`}
            target="_blank" rel="noopener noreferrer"
            style={{
              display: 'block', width: '100%', padding: '10px 0',
              background: C.vertL, color: C.vert,
              border: `1.5px solid ${C.vert}`, borderRadius: 10,
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
              textAlign: 'center', textDecoration: 'none',
            }}
          >
            🔗 Accéder via le lien web
          </a>
          <div style={{ fontSize: 10, color: C.sec, marginTop: 4, textAlign: 'center', wordBreak: 'break-all' }}>
            {r.lienWeb}
          </div>
        </div>
      )}
    </Modal>
  );
}

function VRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBlock: 6, borderBottom: `1px solid ${C.bord}`, fontSize: 13 }}>
      <span style={{ color: C.sec, fontWeight: 600, minWidth: 90 }}>{label}</span>
      <span style={{ color: C.txt, textAlign: 'right', flex: 1 }}>{value || '—'}</span>
    </div>
  );
}

/* ── Modal Modifier ── */
function EditDocModal({ rapport: r, setRapports, onClose }) {
  const [objet, setObjet]         = useState(r.objet || r.titre || '');
  const [type, setType]           = useState(r.type || '');
  const [dateSoumis, setDate]     = useState(r.dateSubmission || today());
  const [moisDoc, setMoisDoc]     = useState(String(r.moisDoc || new Date().getMonth() + 1));
  const [auteurIds, setAuteurIds] = useState(Array.isArray(r.auteurIds) ? r.auteurIds : []);
  const [sousDirIds, setSdIds]    = useState(Array.isArray(r.sousDirIds) ? r.sousDirIds : []);
  const [semaine, setSemaine]     = useState(String(r.semaine || isoWeek(new Date())));
  const [resume, setResume]       = useState(r.resume || '');
  const [fichierNom, setFich]     = useState(r.fichierNom || '');
  const [lienWeb, setLienWeb]     = useState(r.lienWeb || '');
  const [fileObj, setFileObj]     = useState(null);
  const [saving, setSaving]       = useState(false);
  const [err, setErr]             = useState('');

  const typeObj = TYPES.find(t => t.label === type);
  const isHebdo = typeObj?.hebdo;
  const moisOpts = MOIS_NOMS.map((m, i) => ({ value: String(i + 1), label: m }));
  const typeOpts = TYPES.map(t => ({ value: t.label, label: t.label }));

  const save = async () => {
    if (!objet.trim() || !type) { setErr('Objet et type sont requis.'); return; }
    setSaving(true);
    let storedFichierNom = fichierNom;
    if (fileObj) {
      const path = `${Date.now()}_${fileObj.name}`;
      const { error } = await supabase.storage.from('documents').upload(path, fileObj, { upsert: true });
      if (!error) storedFichierNom = path;
    }
    const updates = {
      objet: objet.trim(), titre: objet.trim(), type,
      date_submission: dateSoumis, mois_doc: Number(moisDoc),
      semaine: isHebdo ? Number(semaine) : null,
      resume: resume.trim(),
      fichier_nom: storedFichierNom || null,
      lien_web: lienWeb.trim() || null,
      auteur_ids: auteurIds,
      sous_directions: sousDirIds,
    };
    await supabase.from('rapports').update(updates).eq('id', r.id);
    setRapports(rs => rs.map(x => x.id === r.id
      ? { ...x, objet: objet.trim(), titre: objet.trim(), type, dateSubmission: dateSoumis,
          moisDoc: Number(moisDoc), semaine: isHebdo ? Number(semaine) : null,
          resume: resume.trim(), fichierNom: storedFichierNom || x.fichierNom,
          lienWeb: lienWeb.trim() || x.lienWeb, auteurIds, sousDirIds }
      : x));
    setSaving(false);
    onClose();
  };

  return (
    <Modal title="Modifier le document" sub={r.reference} onClose={onClose}>
      <Input label="Objet du document" value={objet} onChange={setObjet} required />
      <Input label="Date de soumission" value={dateSoumis} onChange={setDate} type="date" required />
      <Select label="Type" value={type} onChange={setType} options={typeOpts} placeholder="Choisir un type…" required />
      <Select label="Mois" value={moisDoc} onChange={setMoisDoc} options={moisOpts} />
      <MultiSelectImpute label="Auteur(s)" selected={auteurIds} onChange={setAuteurIds} options={IMPUTE_OPTIONS} placeholder="Choisir…" />
      <MultiSelectImpute label="Sous-Direction(s)" selected={sousDirIds} onChange={setSdIds} options={SOUS_DIR_OPTIONS} placeholder="Choisir…" />
      {isHebdo && <Input label="N° semaine" value={semaine} onChange={setSemaine} type="number" />}
      <Textarea label="Résumé" value={resume} onChange={setResume} rows={2} />
      <UploadZone label="Remplacer le fichier (optionnel)" fichierNom={fichierNom} setFichierNom={setFich} onFile={setFileObj} />
      <Input label="Lien web d'accès (optionnel)" value={lienWeb} onChange={setLienWeb} placeholder="https://…" />
      {err && <div style={{ color: C.urg, fontSize: 12, marginBottom: 10 }}>{err}</div>}
      <Btn onClick={save} full disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer les modifications'}</Btn>
    </Modal>
  );
}

/* ── Modal Déposer ── */
function DeposeModal({ rapports, setRapports, user, onClose }) {
  const [objet, setObjet]         = useState('');
  const [dateSoumis, setDate]     = useState(today());
  const [type, setType]           = useState('');
  const [moisDoc, setMoisDoc]     = useState(String(new Date().getMonth() + 1));
  const [auteurIds, setAuteurIds] = useState([]);   // vide par défaut
  const [sousDirIds, setSdIds]    = useState([]);
  const [semaine, setSemaine]     = useState(String(isoWeek(new Date())));
  const [resume, setResume]       = useState('');
  const [fichierNom, setFich]     = useState('');
  const [lienWeb, setLienWeb]     = useState('');
  const [fileObj, setFileObj]     = useState(null);
  const [saving, setSaving]       = useState(false);
  const [err, setErr]             = useState('');

  const typeObj    = TYPES.find(t => t.label === type);
  const isHebdo    = typeObj?.hebdo;
  const annee      = new Date().getFullYear();
  const moisOpts   = MOIS_NOMS.map((m, i) => ({ value: String(i + 1), label: m }));
  const typeOpts   = TYPES.map(t => ({ value: t.label, label: t.label }));
  const prefix     = typeObj?.prefix || 'DOC';
  const previewRef = genRef(prefix, rapports.map(r => r.reference), dateSoumis);

  const submit = async () => {
    if (!objet.trim() || !type) { setErr('Objet et type sont requis.'); return; }
    setSaving(true);
    let storedFichierNom = fichierNom;
    if (fileObj) {
      const path = `${Date.now()}_${fileObj.name}`;
      const { error } = await supabase.storage.from('documents').upload(path, fileObj, { upsert: true });
      if (!error) storedFichierNom = path;
    }
    const newR = {
      id: `r${Date.now()}`, reference: previewRef,
      objet: objet.trim(), titre: objet.trim(), type,
      serviceId: user.serviceId || null,
      annee, semaine: isHebdo ? Number(semaine) : null,
      moisDoc: Number(moisDoc),
      auteur: `${user.prenom} ${user.nom}`,
      resume: resume.trim(), dateSubmission: dateSoumis,
      createdAt: new Date().toISOString(),
      fichierNom: storedFichierNom,
      lienWeb: lienWeb.trim() || null,
      auteurIds,
      sousDirIds,
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
      <MultiSelectImpute label="Auteur(s)" selected={auteurIds} onChange={setAuteurIds} options={IMPUTE_OPTIONS} placeholder="Choisir…" />
      <MultiSelectImpute label="Sous-Direction(s)" selected={sousDirIds} onChange={setSdIds} options={SOUS_DIR_OPTIONS} placeholder="Choisir…" />
      <Input label="Année" value={String(annee)} onChange={() => {}} disabled />
      {isHebdo && <Input label="N° semaine" value={semaine} onChange={setSemaine} type="number" />}
      <Textarea label="Résumé" value={resume} onChange={setResume} rows={2} />
      <div style={{ fontSize: 11, color: C.sec, marginBottom: 12, fontFamily: 'monospace' }}>
        Référence : {previewRef}
      </div>
      <UploadZone label="Fichier" fichierNom={fichierNom} setFichierNom={setFich} onFile={setFileObj} />
      <Input label="Lien web d'accès (optionnel)" value={lienWeb} onChange={setLienWeb} placeholder="https://…" />
      {err && <div style={{ color: C.urg, fontSize: 12, marginBottom: 10 }}>{err}</div>}
      <Btn onClick={submit} full disabled={saving} style={{ fontWeight: 700, fontSize: 14 }}>
        {saving ? 'Enregistrement…' : 'Déposer le document'}
      </Btn>
    </Modal>
  );
}
