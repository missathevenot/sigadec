import { useState, useMemo } from 'react';
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

// ── Helpers temporels ──────────────────────────────────────────────────────────
const todayStr = today();

/** Extrait le numéro d'ordre initial (ex: "7. Objet" → 7, sinon Infinity) */
function getOrderNum(intitule) {
  const m = (intitule || '').match(/^(\d+)\./);
  return m ? parseInt(m[1], 10) : Infinity;
}

/** Supprime le numéro d'ordre initial (ex: "7. Objet" → "Objet") */
function stripOrderNum(text) {
  return (text || '').replace(/^\d+\.\s*/, '');
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr + 'T00:00:00') - new Date(todayStr + 'T00:00:00')) / 86400000);
}

function isLate(d) {
  return d.echeance && d.echeance < todayStr && !['executee', 'supprimee'].includes(d.statut);
}

function isUrgentSoon(d) {
  const days = daysUntil(d.echeance);
  return !isLate(d) && days !== null && days <= 3 && days >= 0 && !['executee', 'supprimee'].includes(d.statut);
}

function isTodayDue(d) {
  return d.echeance === todayStr && !['executee', 'supprimee'].includes(d.statut);
}

// Couleur de la barre de progression selon le statut et la valeur
function progressColor(v, d) {
  if (isLate(d))         return C.urg;
  if (isUrgentSoon(d))   return C.orng;
  if (v >= 100)          return C.vert;
  if (v >= 60)           return C.vertM;
  if (v >= 30)           return C.cours;
  return C.orng;
}

// ── Mini Donut SVG ────────────────────────────────────────────────────────────
function Donut({ value, size = 52, stroke = 7, color = C.vert }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.bord} strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
        strokeWidth={stroke} strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round" style={{ transition: 'stroke-dasharray .5s ease' }} />
    </svg>
  );
}

// ── Barre de progression améliorée ────────────────────────────────────────────
function ProgBar({ v = 0, d }) {
  const val = Math.min(100, Math.max(0, v));
  const col = progressColor(val, d);
  return (
    <div style={{ position: 'relative', background: C.bord, borderRadius: 8, height: 18, overflow: 'hidden', width: '100%' }}>
      <div style={{
        width: `${val}%`, background: col, height: '100%',
        borderRadius: 8, transition: 'width .4s ease',
      }} />
      <span style={{
        position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 800,
        color: val > 40 ? '#fff' : col,
        textShadow: val > 40 ? '0 1px 2px rgba(0,0,0,.3)' : 'none',
      }}>
        {val}%
      </span>
    </div>
  );
}

// ── Pastille statut ───────────────────────────────────────────────────────────
function StatutDot({ statut, echeance }) {
  // Priorité : en retard > statut normal
  let dotColor, label;
  const st = DIL_STATUTS.find(s => s.v === statut);

  if (isLate({ echeance, statut })) {
    dotColor = C.urg; label = 'En retard';
  } else {
    dotColor = st?.c || C.sec;
    label    = st?.l || statut;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{
        width: 9, height: 9, borderRadius: '50%',
        background: dotColor, display: 'inline-block', flexShrink: 0,
        boxShadow: `0 0 0 2px ${dotColor}30`,
      }} />
      <span style={{ fontSize: 11, fontWeight: 700, color: dotColor }}>{label}</span>
    </div>
  );
}

// ── Tableau de bord synthétique ───────────────────────────────────────────────
function StatsPanel({ diligences, onFilterChange }) {
  const total    = diligences.length;
  const actives  = diligences.filter(d => !['executee','supprimee'].includes(d.statut)).length;
  const retard   = diligences.filter(d => isLate(d)).length;
  const exec     = diligences.filter(d => d.statut === 'executee').length;

  const activeDils = diligences.filter(d => !['executee','supprimee'].includes(d.statut));
  const avgProg = activeDils.length > 0
    ? Math.round(activeDils.reduce((s, d) => s + (d.progression ?? 0), 0) / activeDils.length)
    : 0;

  const cards = [
    { label: 'Total',    value: total,   color: C.cours, bg: C.coursB,  filter: 'all',          dot: C.cours },
    { label: 'Actives',  value: actives, color: C.vert,  bg: C.vertL,   filter: 'non_executee', dot: C.vert  },
    { label: 'En retard',value: retard,  color: C.urg,   bg: C.urgB,    filter: 'non_executee', dot: C.urg   },
    { label: 'Exécutées',value: exec,    color: C.ok,    bg: C.okB,     filter: 'executee',     dot: C.ok    },
  ];

  return (
    <div style={{ marginBottom: 14 }}>
      {/* 4 KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginBottom: 10 }}>
        {cards.map(c => (
          <button key={c.label} onClick={() => onFilterChange(c.filter)} style={{
            background: c.bg, border: `1.5px solid ${c.color}30`,
            borderRadius: 12, padding: '10px 6px', cursor: 'pointer',
            textAlign: 'center', transition: 'transform .15s',
          }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{ fontSize: 22, fontWeight: 900, color: c.color, fontFamily: 'Nunito,sans-serif', lineHeight: 1 }}>
              {c.value}
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, color: c.color, marginTop: 3, textTransform: 'uppercase', letterSpacing: .4 }}>
              {c.label}
            </div>
          </button>
        ))}
      </div>

      {/* Progression globale */}
      <div style={{
        background: C.blanc, border: `1.5px solid ${C.bord}`,
        borderRadius: 12, padding: '10px 14px',
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Donut value={avgProg} size={52} stroke={7} color={avgProg >= 70 ? C.vert : avgProg >= 40 ? C.cours : C.orng} />
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 900, color: C.txt,
          }}>
            {avgProg}%
          </div>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.txt }}>Progression globale</div>
          <div style={{ fontSize: 11, color: C.sec, marginTop: 2 }}>
            Taux moyen des {activeDils.length} diligence{activeDils.length > 1 ? 's' : ''} active{activeDils.length > 1 ? 's' : ''}
          </div>
          <div style={{ marginTop: 6 }}>
            <ProgBar v={avgProg} d={{}} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Bannière notifications intelligentes ──────────────────────────────────────
function AlertBanner({ diligences, onFilterChange }) {
  const todayDue   = diligences.filter(d => isTodayDue(d));
  const lateCount  = diligences.filter(d => isLate(d)).length;
  const urgentSoon = diligences.filter(d => isUrgentSoon(d) && !isTodayDue(d)).length;

  if (todayDue.length === 0 && lateCount === 0 && urgentSoon === 0) return null;

  return (
    <div style={{ marginBottom: 12 }}>
      {todayDue.length > 0 && (
        <button onClick={() => onFilterChange('non_executee')} style={{
          width: '100%', textAlign: 'left', background: '#FFF8E6',
          border: `1.5px solid ${C.orng}`, borderRadius: 10, padding: '10px 14px',
          marginBottom: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 18 }}>⏰</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.orng }}>
              {todayDue.length} tâche{todayDue.length > 1 ? 's arrivent' : ' arrive'} à échéance aujourd'hui
            </div>
            <div style={{ fontSize: 10, color: C.orng, marginTop: 1 }}>
              {todayDue.slice(0, 2).map(d => d.intitule).join(' • ')}{todayDue.length > 2 ? ` +${todayDue.length - 2}` : ''}
            </div>
          </div>
          <span style={{ marginLeft: 'auto', fontSize: 14, color: C.orng }}>→</span>
        </button>
      )}

      {lateCount > 0 && (
        <button onClick={() => onFilterChange('non_executee')} style={{
          width: '100%', textAlign: 'left', background: C.urgB,
          border: `1.5px solid ${C.urg}`, borderRadius: 10, padding: '10px 14px',
          marginBottom: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 18 }}>🚨</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.urg }}>
              {lateCount} diligence{lateCount > 1 ? 's sont' : ' est'} en retard
            </div>
            <div style={{ fontSize: 10, color: C.urg, marginTop: 1 }}>Cliquez pour les voir</div>
          </div>
          <span style={{ marginLeft: 'auto', fontSize: 14, color: C.urg }}>→</span>
        </button>
      )}

      {urgentSoon > 0 && (
        <button onClick={() => onFilterChange('non_executee')} style={{
          width: '100%', textAlign: 'left', background: C.orngL,
          border: `1.5px solid ${C.orng}`, borderRadius: 10, padding: '10px 14px',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.orng }}>
              {urgentSoon} tâche{urgentSoon > 1 ? 's arrivent' : ' arrive'} à échéance dans moins de 3 jours
            </div>
            <div style={{ fontSize: 10, color: C.orng, marginTop: 1 }}>Cliquez pour les voir</div>
          </div>
          <span style={{ marginLeft: 'auto', fontSize: 14, color: C.orng }}>→</span>
        </button>
      )}
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function DiligencesPage({ diligences, setDiligences, courriers, user, navigate }) {
  const { users } = useStore();

  const [search, setSearch]       = useState('');
  const [filtre, setFiltre]       = useState('non_executee');
  const [fonctionF, setFonctionF] = useState('all');
  const [year, setYear]           = useState(null);
  const [month, setMonth]         = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDil, setEditing]  = useState(null);

  const initialiserFiltres = () => {
    setSearch(''); setFiltre('non_executee');
    setFonctionF('all'); setYear(null); setMonth(null);
  };

  const filtered = useMemo(() => diligences
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
    // Tri primaire : numéro d'ordre croissant — secondaire : urgence
    .sort((a, b) => {
      const numA = getOrderNum(a.intitule);
      const numB = getOrderNum(b.intitule);
      if (numA !== numB) return numA - numB;
      const scoreA = isLate(a) ? 2 : isUrgentSoon(a) ? 1 : 0;
      const scoreB = isLate(b) ? 2 : isUrgentSoon(b) ? 1 : 0;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return new Date(a.echeance || '9999') - new Date(b.echeance || '9999');
    }),
    [diligences, search, filtre, fonctionF, year, month, users]
  );

  const canSubmit = ROLES_SOUMISSION_DIL.includes(user.role);
  const canAct    = user.role !== 'secretariat';

  const handleDuplicate = async (d) => {
    const ref  = genRef('DIL', diligences.map(x => x.reference), today());
    const copy = { ...d, id: `dil${Date.now()}`, reference: ref, dateSubmission: today(), historique: [] };
    await supabase.from('diligences').insert(diligenceToDb(copy));
    setDiligences(ds => [copy, ...ds]);
  };

  return (
    <div style={{ padding: '14px 14px 0', animation: 'pageIn .22s ease-out' }}>

      {/* ── Tableau de bord synthétique ── */}
      <StatsPanel diligences={diligences} onFilterChange={setFiltre} />

      {/* ── Notifications intelligentes ── */}
      <AlertBanner diligences={diligences} onFilterChange={setFiltre} />

      {/* ── En-tête ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 15, color: C.txt }}>
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

      {/* ── Barre de recherche ── */}
      <input
        value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Rechercher référence DIL/… ou objet…"
        style={{ width: '100%', boxSizing: 'border-box', border: `1.5px solid ${C.bord}`, borderRadius: 10, padding: '9px 14px', fontSize: 13, fontFamily: 'Inter, sans-serif', marginBottom: 10, outline: 'none' }}
      />

      {/* ── Filtres statut ── */}
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

      {/* ── Filtre Fonction ── */}
      <select value={fonctionF} onChange={e => setFonctionF(e.target.value)} style={{
        width: '100%', border: `1.5px solid ${C.bord}`, borderRadius: 9,
        padding: '8px 12px', fontSize: 13, marginBottom: 10, outline: 'none',
        background: C.blanc, boxSizing: 'border-box', color: C.txt,
      }}>
        {FONCTION_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      <YearMonthFilter year={year} setYear={setYear} month={month} setMonth={setMonth} />

      {/* ── Liste ── */}
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

      {modalOpen  && <SubmitModal diligences={diligences} setDiligences={setDiligences} courriers={courriers} user={user} onClose={() => setModalOpen(false)} />}
      {editingDil && <EditModal diligence={editingDil} setDiligences={setDiligences} onClose={() => setEditing(null)} />}
    </div>
  );
}

// ── Carte Diligence améliorée ─────────────────────────────────────────────────
function DilCard({ d, users, canAct, isAdmin, navigate, onEdit, onDuplicate, setDiligences }) {
  const [deleting, setDeleting] = useState(false);
  const imputeList = Array.isArray(d.imputeA) ? d.imputeA : (d.imputeA ? [d.imputeA] : []);

  const late    = isLate(d);
  const urgent  = isUrgentSoon(d);
  const dueDay  = isTodayDue(d);
  const days    = daysUntil(d.echeance);

  // Couleur de la bordure gauche
  const borderColor = late ? C.urg : urgent ? C.orng : dueDay ? C.orng : C.bord;
  const cardBg      = late ? '#FFF8F8' : urgent ? '#FFFBF2' : C.blanc;

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Supprimer définitivement cette diligence ?')) return;
    setDeleting(true);
    await supabase.from('diligences').delete().eq('id', d.id);
    setDiligences(ds => ds.filter(x => x.id !== d.id));
  };

  // Label échéance
  let echeanceLabel = fmtDate(d.echeance);
  let echeanceColor = C.sec;
  if (late) {
    echeanceLabel = `⚠ En retard de ${Math.abs(days)} j — ${fmtDate(d.echeance)}`;
    echeanceColor = C.urg;
  } else if (dueDay) {
    echeanceLabel = `⏰ Aujourd'hui — ${fmtDate(d.echeance)}`;
    echeanceColor = C.orng;
  } else if (urgent) {
    echeanceLabel = `⚡ Dans ${days} j — ${fmtDate(d.echeance)}`;
    echeanceColor = C.orng;
  }

  return (
    <div style={{
      background: cardBg,
      border: `1.5px solid ${borderColor}`,
      borderLeft: `4px solid ${borderColor}`,
      borderRadius: 12,
      padding: '12px 14px',
      marginBottom: 12,
      boxShadow: late ? `0 2px 8px ${C.urg}20` : urgent ? `0 2px 8px ${C.orng}20` : '0 1px 4px rgba(0,0,0,.06)',
      transition: 'box-shadow .2s',
    }}>
      {/* Ligne 1 : référence + statut */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <span style={{ fontSize: 10, color: C.sec, fontFamily: 'monospace' }}>{d.reference}</span>
        <StatutDot statut={d.statut} echeance={d.echeance} />
      </div>

      {/* Badge URGENT / EN RETARD */}
      {(late || dueDay) && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          background: late ? C.urgB : '#FFF3CD',
          color: late ? C.urg : '#856404',
          border: `1px solid ${late ? C.urg : C.orng}`,
          borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 800,
          marginBottom: 6,
        }}>
          {late ? '🔴 EN RETARD' : '🟡 AUJOURD\'HUI'}
        </div>
      )}

      {/* Titre */}
      <div style={{ fontSize: 14, fontWeight: 800, color: C.txt, marginBottom: 8, lineHeight: 1.4 }}>
        {d.intitule}
      </div>

      {/* Barre de progression colorée avec % intégré */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 10, color: C.sec, fontWeight: 600 }}>Taux de réalisation</span>
        </div>
        <ProgBar v={d.progression ?? 0} d={d} />
      </div>

      {/* Imputée à */}
      {imputeList.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
          {imputeList.map(v => (
            <span key={v} style={{ background: C.coursB, color: C.cours, borderRadius: 8, padding: '2px 7px', fontSize: 10, fontWeight: 600 }}>{v}</span>
          ))}
        </div>
      )}

      {/* Échéance */}
      <div style={{ fontSize: 11, fontWeight: late || urgent || dueDay ? 700 : 500, color: echeanceColor, marginBottom: 10 }}>
        📅 {echeanceLabel}
      </div>

      {/* Boutons d'action */}
      {canAct && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <ActionBtn label="👁 Afficher"  color={C.cours} bg={C.coursB} onClick={() => navigate('diligence-detail', { id: d.id })} />
          <ActionBtn label="✏️ Modifier"  color={C.vert}  bg={C.vertL}  onClick={onEdit} />
          <ActionBtn label="⧉ Dupliquer" color={C.orng}  bg={C.orngL}  onClick={onDuplicate} />
          {isAdmin && (
            <ActionBtn label={deleting ? '…' : '🗑️'} color={C.urg} bg="#FEF2F2" onClick={handleDelete} />
          )}
        </div>
      )}
    </div>
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

  // Auto 100% quand statut → Exécutée
  const handleStatutChange = (v) => {
    setStatut(v);
    if (v === 'executee') setProgression(100);
  };

  const submit = async () => {
    if (!intitule.trim() || !echeance) { setErr('Objet et échéance sont requis.'); return; }
    setSaving(true);
    const finalIntitule = statut === 'executee' ? stripOrderNum(intitule.trim()) : intitule.trim();
    const finalProg     = statut === 'executee' ? 100 : Number(progression);
    const ref = genRef('DIL', diligences.map(d => d.reference), dateSoumis);
    const newDil = {
      id: `dil${Date.now()}`, reference: ref, intitule: finalIntitule,
      assigneA: user.id, serviceIds: [], imputeA,
      statut, progression: finalProg,
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
      <Select label="Statut" value={statut} onChange={handleStatutChange} options={statutOpts} required />
      <Input label="Date de soumission" value={dateSoumis} onChange={setDateSoumis} type="date" required />
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.sec, marginBottom: 6 }}>
          Taux de réalisation : <span style={{ color: C.vert, fontWeight: 800 }}>{progression}%</span>
        </label>
        <input type="range" min={0} max={100} value={progression} onChange={e => setProgression(e.target.value)} style={{ width: '100%', accentColor: C.vert }} />
        <div style={{ marginTop: 6 }}><ProgBar v={Number(progression)} d={{}} /></div>
      </div>
      <Input label="Date d'échéance" value={echeance} onChange={setEcheance} type="date" required />
      <Textarea label="Description" value={description} onChange={setDescription} rows={3} />
      <Input label="Nature du document" value={objetDoc} onChange={setObjetDoc} />
      <UploadZone label="Téléverser un document" fichierNom={fichierNom} setFichierNom={setFichierNom} />
      {err && <div style={{ color: C.urg, fontSize: 12, marginBottom: 10 }}>{err}</div>}
      <Btn onClick={submit} full disabled={saving} style={{ fontWeight: 700, fontSize: 14 }}>
        {saving ? 'Enregistrement…' : 'Soumettre la diligence'}
      </Btn>
    </Modal>
  );
}

/* ── Modal Modifier ── */
function EditModal({ diligence, setDiligences, onClose }) {
  const [intitule, setIntitule] = useState(diligence.intitule);
  const [imputeA, setImputeA]   = useState(Array.isArray(diligence.imputeA) ? diligence.imputeA : []);
  const [echeance, setEcheance] = useState(diligence.echeance || '');
  const [description, setDesc]  = useState(diligence.description || '');
  const [statut, setStatut]     = useState(diligence.statut);
  const [progression, setProg]  = useState(diligence.progression ?? 0);
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState('');

  // Auto 100% quand statut → Exécutée
  const handleStatutChange = (v) => {
    setStatut(v);
    if (v === 'executee') setProg(100);
  };

  const save = async () => {
    if (!intitule.trim()) { setErr("L'objet est requis."); return; }
    setSaving(true);
    // Supprime le n° d'ordre si statut devient Exécutée
    const finalIntitule = statut === 'executee' ? stripOrderNum(intitule.trim()) : intitule.trim();
    const finalProg     = statut === 'executee' ? 100 : Number(progression);
    const updates = { intitule: finalIntitule, impute_a: imputeA, echeance, description, statut, progression: finalProg };
    await supabase.from('diligences').update(updates).eq('id', diligence.id);
    setDiligences(ds => ds.map(d => d.id === diligence.id
      ? { ...d, intitule: finalIntitule, imputeA, echeance, description, statut, progression: finalProg }
      : d));
    setSaving(false);
    onClose();
  };

  return (
    <Modal title="Modifier la diligence" sub={diligence.reference} onClose={onClose}>
      <Input label="Objet de la diligence" value={intitule} onChange={setIntitule} required />
      <MultiSelectImpute label="Imputée à" selected={imputeA} onChange={setImputeA} options={IMPUTE_OPTIONS} placeholder="Choisir…" />
      <Select label="Statut" value={statut} onChange={handleStatutChange} options={DIL_STATUTS.map(s => ({ value: s.v, label: s.l }))} required />
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.sec, marginBottom: 6 }}>
          Taux de réalisation : <span style={{ color: C.vert, fontWeight: 800 }}>{progression}%</span>
        </label>
        <input type="range" min={0} max={100} value={progression} onChange={e => setProg(e.target.value)} style={{ width: '100%', accentColor: C.vert }} />
        <div style={{ marginTop: 6 }}><ProgBar v={Number(progression)} d={diligence} /></div>
      </div>
      <Input label="Date d'échéance" value={echeance} onChange={setEcheance} type="date" />
      <Textarea label="Description" value={description} onChange={setDesc} rows={3} />
      {err && <div style={{ color: C.urg, fontSize: 12, marginBottom: 10 }}>{err}</div>}
      <Btn onClick={save} full disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer les modifications'}</Btn>
    </Modal>
  );
}
