/**
 * Composant partagé DilCard — utilisé dans DiligencesPage, Dashboard et MonEspace.
 * Même design : bordure colorée, statut pastille, barre de progression avec %, urgence.
 */
import { useState } from 'react';
import { C } from '../../constants/colors';
import { DIL_STATUTS } from '../../constants/statuts';
import { fmtDate, today } from '../../utils/dates';
import { supabase } from '../../lib/supabase';

const todayStr = today();

export function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr + 'T00:00:00') - new Date(todayStr + 'T00:00:00')) / 86400000);
}
export function isLate(d) {
  return d.echeance && d.echeance < todayStr && !['executee', 'supprimee'].includes(d.statut);
}
export function isUrgentSoon(d) {
  const days = daysUntil(d.echeance);
  return !isLate(d) && days !== null && days <= 3 && days >= 0 && !['executee', 'supprimee'].includes(d.statut);
}
export function isTodayDue(d) {
  return d.echeance === todayStr && !['executee', 'supprimee'].includes(d.statut);
}

function progressColor(v, d) {
  if (isLate(d))       return C.urg;
  if (isUrgentSoon(d)) return C.orng;
  if (v >= 100)        return C.vert;
  if (v >= 60)         return C.vertM;
  if (v >= 30)         return C.cours;
  return C.orng;
}

export function ProgBar({ v = 0, d = {} }) {
  const val = Math.min(100, Math.max(0, v));
  const col = progressColor(val, d);
  return (
    <div style={{ position: 'relative', background: C.bord, borderRadius: 8, height: 18, overflow: 'hidden', width: '100%' }}>
      <div style={{ width: `${val}%`, background: col, height: '100%', borderRadius: 8, transition: 'width .4s ease' }} />
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

export function StatutDot({ statut, echeance }) {
  const st = DIL_STATUTS.find(s => s.v === statut);
  let dotColor, label;
  if (isLate({ echeance, statut })) {
    dotColor = C.urg; label = 'En retard';
  } else {
    dotColor = st?.c || C.sec;
    label    = st?.l || statut;
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 9, height: 9, borderRadius: '50%', background: dotColor, display: 'inline-block', flexShrink: 0, boxShadow: `0 0 0 2px ${dotColor}30` }} />
      <span style={{ fontSize: 11, fontWeight: 700, color: dotColor }}>{label}</span>
    </div>
  );
}

function ActionBtn({ label, color, bg, onClick }) {
  return (
    <button onClick={onClick} style={{ padding: '5px 10px', borderRadius: 8, border: `1px solid ${color}`, background: bg, color, fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
      {label}
    </button>
  );
}

/**
 * @param {object} d           — diligence object
 * @param {boolean} canAct     — user can take actions
 * @param {boolean} isAdmin    — user is admin
 * @param {function} navigate  — navigate function
 * @param {function} onEdit    — open edit modal (optional)
 * @param {function} onDuplicate — duplicate handler (optional)
 * @param {function} setDiligences — state setter (optional, for delete)
 * @param {boolean} compact    — compact mode (no duplicate/delete buttons) for Dashboard
 */
export function DilCardShared({ d, canAct, isAdmin, navigate, onEdit, onDuplicate, setDiligences, compact = false }) {
  const [deleting, setDeleting] = useState(false);
  const imputeList = Array.isArray(d.imputeA) ? d.imputeA : (d.imputeA ? [d.imputeA] : []);

  const late   = isLate(d);
  const urgent = isUrgentSoon(d);
  const dueDay = isTodayDue(d);
  const days   = daysUntil(d.echeance);

  const borderColor = late ? C.urg : urgent ? C.orng : dueDay ? C.orng : C.bord;
  const cardBg      = late ? '#FFF8F8' : urgent ? '#FFFBF2' : C.blanc;

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Supprimer définitivement cette diligence ?')) return;
    setDeleting(true);
    await supabase.from('diligences').delete().eq('id', d.id);
    setDiligences && setDiligences(ds => ds.filter(x => x.id !== d.id));
  };

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
      marginBottom: 10,
      boxShadow: late ? `0 2px 8px ${C.urg}20` : urgent ? `0 2px 8px ${C.orng}20` : '0 1px 4px rgba(0,0,0,.06)',
    }}>
      {/* Ligne 1 : référence + statut */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <span style={{ fontSize: 10, color: C.sec, fontFamily: 'monospace' }}>{d.reference}</span>
        <StatutDot statut={d.statut} echeance={d.echeance} />
      </div>

      {/* Badge urgence */}
      {(late || dueDay) && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          background: late ? C.urgB : '#FFF3CD',
          color: late ? C.urg : '#856404',
          border: `1px solid ${late ? C.urg : C.orng}`,
          borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 800, marginBottom: 6,
        }}>
          {late ? "🔴 EN RETARD" : "🟡 AUJOURD'HUI"}
        </div>
      )}

      {/* Titre */}
      <div style={{ fontSize: 14, fontWeight: 800, color: C.txt, marginBottom: 8, lineHeight: 1.4 }}>
        {d.intitule}
      </div>

      {/* Barre de progression */}
      <div style={{ marginBottom: 8 }}>
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
      <div style={{ fontSize: 11, fontWeight: late || urgent || dueDay ? 700 : 500, color: echeanceColor, marginBottom: canAct ? 10 : 0 }}>
        📅 {echeanceLabel}
      </div>

      {/* Boutons */}
      {canAct && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <ActionBtn label="👁 Afficher"  color={C.cours} bg={C.coursB} onClick={() => navigate('diligence-detail', { id: d.id })} />
          {onEdit && <ActionBtn label="✏️ Modifier" color={C.vert} bg={C.vertL} onClick={onEdit} />}
          {!compact && onDuplicate && <ActionBtn label="⧉ Dupliquer" color={C.orng} bg={C.orngL} onClick={onDuplicate} />}
          {!compact && isAdmin && setDiligences && (
            <ActionBtn label={deleting ? '…' : '🗑️'} color={C.urg} bg="#FEF2F2" onClick={handleDelete} />
          )}
        </div>
      )}
    </div>
  );
}
