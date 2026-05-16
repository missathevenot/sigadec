import { useState } from 'react';
import { C } from '../../constants/colors';
import { DIL_STATUTS } from '../../constants/statuts';
import { IMPUTE_OPTIONS } from '../../constants/imputation';
import { fmtDate, today } from '../../utils/dates';
import { supabase } from '../../lib/supabase';
import Btn from '../../components/ui/Btn';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Input from '../../components/ui/Input';
import MultiSelectImpute from '../../components/ui/MultiSelectImpute';
import { isLate, isUrgentSoon, isTodayDue } from '../../components/shared/DilCardShared';

// ── Couleurs sémantiques ───────────────────────────────────────────────────────
const ALERT_RED  = '#E24B4A';   // retard / alerte critique
const ALERT_BG   = '#FEF2F2';
const TEAL_GR    = '#0E7490';   // statut En cours
const TEAL_BG    = '#CFFAFE';

/** Supprime le numéro d'ordre initial */
function stripOrderNum(text) {
  return (text || '').replace(/^\d+\.\s*/, '');
}

/** Barre de progression colorée avec % intégré */
function ProgBarDetail({ v = 0, late = false, urgent = false }) {
  const val = Math.min(100, Math.max(0, v));
  const col = late ? ALERT_RED : urgent ? C.orng : val >= 100 ? C.vert : val >= 60 ? C.vertM : val >= 30 ? C.cours : C.orng;
  return (
    <div style={{ position: 'relative', background: C.bord, borderRadius: 8, height: 18, overflow: 'hidden' }}>
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

/** Badge statut avec couleur sémantique */
function StatutBadge({ statut, echeance }) {
  const isRetard = isLate({ echeance, statut });
  if (isRetard) {
    return (
      <span style={{ background: ALERT_BG, color: ALERT_RED, border: `1.5px solid ${ALERT_RED}`, borderRadius: 8, padding: '3px 10px', fontSize: 11, fontWeight: 800 }}>
        🔴 EN RETARD
      </span>
    );
  }
  const st = DIL_STATUTS.find(s => s.v === statut);
  const color = statut === 'en_cours' ? TEAL_GR : st?.c || C.sec;
  const bg    = statut === 'en_cours' ? TEAL_BG : st?.bg || '#F0F2F5';
  return (
    <span style={{ background: bg, color, border: `1.5px solid ${color}`, borderRadius: 8, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
      {st?.l || statut}
    </span>
  );
}

export default function DiligenceDetail({ diligence, diligences, setDiligences, courriers, user, navigate }) {
  const [modalEdit, setModalEdit] = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [hoverEdit, setHoverEdit] = useState(false);
  const [hoverDel,  setHoverDel]  = useState(false);

  if (!diligence) return (
    <div style={{ padding: 20, textAlign: 'center', color: C.sec }}>Diligence introuvable.</div>
  );

  const likedCourriers = (diligence.courrierIds || []).map(id => courriers?.find(c => c.id === id)).filter(Boolean);
  const canEdit = user.role !== 'secretariat';
  const isAdmin = user.role === 'admin';

  const late   = isLate(diligence);
  const urgent = isUrgentSoon(diligence);
  const dueDay = isTodayDue(diligence);

  const accentColor = late ? ALERT_RED : urgent || dueDay ? C.orng : C.vert;
  const heroBg      = late ? ALERT_BG  : urgent || dueDay ? C.orngL : C.blanc;

  const handleDelete = async () => {
    if (!window.confirm('Supprimer définitivement cette diligence ?')) return;
    setDeleting(true);
    await supabase.from('diligences').delete().eq('id', diligence.id);
    setDiligences(ds => ds.filter(d => d.id !== diligence.id));
    navigate('diligences');
  };

  return (
    <div style={{ padding: '0 0 20px', animation: 'pageIn .22s ease-out' }}>

      {/* ── Barre Retour (fond blanc, ombre légère) ── */}
      <div style={{
        background: C.blanc,
        boxShadow: '0 2px 8px rgba(0,0,0,.08)',
        padding: '12px 16px',
        marginBottom: 14,
        display: 'flex', alignItems: 'center',
      }}>
        <button onClick={() => navigate('diligences')} style={{
          background: 'none', border: 'none', color: C.vert,
          fontWeight: 700, cursor: 'pointer', fontSize: 13,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          ← Retour aux diligences
        </button>
        <span style={{ marginLeft: 'auto', fontFamily: 'monospace', fontSize: 10, color: C.sec }}>
          {diligence.reference}
        </span>
      </div>

      <div style={{ padding: '0 14px' }}>

        {/* ── Card 1 : Héro — statut + titre + progression ── */}
        <div style={{
          background: heroBg,
          borderLeft: `4px solid ${accentColor}`,
          borderRadius: 14,
          padding: '16px',
          marginBottom: 12,
          boxShadow: `0 4px 20px rgba(0,0,0,.10), 0 1px 6px rgba(0,0,0,.06), 0 0 0 1px rgba(0,0,0,.04)`,
        }}>
          {/* Badge statut */}
          <div style={{ marginBottom: 10 }}>
            <StatutBadge statut={diligence.statut} echeance={diligence.echeance} />
          </div>

          {/* Titre — gras et souligné */}
          <div style={{
            fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 17,
            color: C.txt, marginBottom: 14, lineHeight: 1.4,
            textDecoration: 'underline', textDecorationColor: `${accentColor}60`,
            textUnderlineOffset: 3,
          }}>
            {diligence.intitule}
          </div>

          {/* Taux de réalisation */}
          <div style={{ marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: C.sec, fontWeight: 600 }}>Taux de réalisation</span>
            <span style={{ fontSize: 13, fontWeight: 900, color: accentColor }}>
              {diligence.progression ?? 0}%
            </span>
          </div>
          <ProgBarDetail v={diligence.progression ?? 0} late={late} urgent={urgent} />
        </div>

        {/* ── Card 2 : Métadonnées — imputée à, dates ── */}
        <div style={{
          background: C.blanc,
          borderRadius: 14,
          padding: '14px 16px',
          marginBottom: 12,
          boxShadow: '0 2px 12px rgba(0,0,0,.08), 0 1px 4px rgba(0,0,0,.05)',
        }}>
          {/* Imputée à */}
          <div style={{ paddingBottom: 10, borderBottom: `1px solid ${C.bord}`, marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: C.sec, fontWeight: 600, marginBottom: 6 }}>IMPUTÉE À</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(Array.isArray(diligence.imputeA) ? diligence.imputeA : [diligence.imputeA]).filter(Boolean).length > 0
                ? (Array.isArray(diligence.imputeA) ? diligence.imputeA : [diligence.imputeA]).filter(Boolean).map(v => (
                    <span key={v} style={{
                      background: C.coursB, color: C.cours,
                      borderRadius: 8, padding: '3px 10px',
                      fontSize: 11, fontWeight: 700,
                    }}>{v}</span>
                  ))
                : <span style={{ fontSize: 13, color: C.sec }}>—</span>
              }
            </div>
          </div>

          {/* Dates */}
          <div style={{ display: 'flex', gap: 20 }}>
            <div>
              <div style={{ fontSize: 10, color: C.sec, fontWeight: 600, marginBottom: 2 }}>SOUMIS LE</div>
              <div style={{ fontSize: 13, color: C.txt, fontWeight: 600 }}>{fmtDate(diligence.dateSubmission)}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: late ? ALERT_RED : C.sec, fontWeight: 600, marginBottom: 2 }}>ÉCHÉANCE</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: late ? ALERT_RED : urgent || dueDay ? C.orng : C.txt }}>
                {late && '⚠ '}
                {fmtDate(diligence.echeance)}
              </div>
            </div>
          </div>
        </div>

        {/* Report */}
        {diligence.statut === 'reportee' && (
          <div style={{
            background: C.orngL, borderRadius: 12, padding: '12px 14px',
            marginBottom: 12, borderLeft: `3px solid ${C.orng}`,
            boxShadow: '0 2px 8px rgba(212,90,0,.12)',
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.orng, marginBottom: 4 }}>📆 Diligence reportée</div>
            <div style={{ fontSize: 12, color: C.orng }}>Nouvelle échéance : {fmtDate(diligence.dateReport)}</div>
            {diligence.facteursReport && (
              <div style={{ fontSize: 11, color: C.orng, marginTop: 4 }}>Motif : {diligence.facteursReport}</div>
            )}
          </div>
        )}

        {/* Courriers liés */}
        {likedCourriers.length > 0 && (
          <div style={{
            background: C.blanc, borderRadius: 14, padding: '14px 16px',
            marginBottom: 12, boxShadow: '0 2px 12px rgba(0,0,0,.08)',
          }}>
            <div style={{ fontSize: 11, color: C.sec, fontWeight: 600, marginBottom: 8 }}>COURRIERS LIÉS</div>
            {likedCourriers.map(c => (
              <div key={c.id} style={{ fontSize: 12, color: C.cours, marginBottom: 4 }}>
                ✉️ {c.reference} — {c.objet}
              </div>
            ))}
          </div>
        )}

        {/* ── Card 3 : Description — même border-left que la card héro ── */}
        {(diligence.description || diligence.fichierNom) && (
          <div style={{
            background: C.blanc,
            borderLeft: `4px solid ${accentColor}`,
            borderRadius: 14,
            padding: '14px 16px',
            marginBottom: 12,
            boxShadow: '0 2px 12px rgba(0,0,0,.08), 0 1px 4px rgba(0,0,0,.05)',
          }}>
            {diligence.description && (
              <>
                <div style={{ fontSize: 11, color: C.sec, fontWeight: 600, marginBottom: 8 }}>DESCRIPTION</div>
                <div style={{ fontSize: 13, color: C.txt, lineHeight: 1.6 }}>{diligence.description}</div>
              </>
            )}
            {diligence.fichierNom && (
              <div style={{ marginTop: diligence.description ? 10 : 0 }}>
                <div style={{ fontSize: 11, color: C.sec, fontWeight: 600, marginBottom: 6 }}>DOCUMENT JOINT</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span>📄</span>
                  <span style={{ fontSize: 12, color: C.cours }}>{diligence.fichierNom}</span>
                </div>
                {diligence.objetDoc && (
                  <div style={{ fontSize: 11, color: C.sec, marginTop: 4 }}>{diligence.objetDoc}</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Historique */}
        {diligence.historique?.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: C.sec, fontWeight: 600, marginBottom: 10, letterSpacing: .5 }}>
              HISTORIQUE DES MISES À JOUR
            </div>
            {[...diligence.historique].reverse().map((h, i) => {
              const hst = DIL_STATUTS.find(s => s.v === h.statut);
              return (
                <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: hst?.c || C.sec, flexShrink: 0, marginTop: 3 }} />
                    {i < diligence.historique.length - 1 && (
                      <div style={{ width: 2, flex: 1, background: C.bord, marginTop: 4 }} />
                    )}
                  </div>
                  <div style={{ paddingBottom: 8 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: C.sec }}>{fmtDate(h.date)}</span>
                      {hst && (
                        <span style={{ background: hst.bg, color: hst.c, borderRadius: 6, padding: '1px 8px', fontSize: 10, fontWeight: 700 }}>
                          {hst.l}
                        </span>
                      )}
                      <span style={{ fontSize: 11, fontWeight: 700, color: accentColor }}>{h.progression}%</span>
                    </div>
                    <div style={{ fontSize: 12, color: C.txt, lineHeight: 1.5 }}>{h.commentaire}</div>
                    <div style={{ fontSize: 11, color: C.sec, marginTop: 2 }}>par {h.auteur}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Boutons d'action avec hover coloré ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {canEdit && (
            <button
              onClick={() => setModalEdit(true)}
              onMouseEnter={() => setHoverEdit(true)}
              onMouseLeave={() => setHoverEdit(false)}
              style={{
                width: '100%', padding: '12px 0',
                background: C.vert, color: C.blanc,
                border: 'none', borderRadius: 12,
                fontWeight: 700, fontSize: 14, cursor: 'pointer',
                boxShadow: hoverEdit ? `0 6px 20px ${C.vert}50` : '0 2px 8px rgba(0,0,0,.10)',
                transition: 'box-shadow .2s, transform .15s',
                transform: hoverEdit ? 'translateY(-1px)' : 'none',
              }}
            >
              ✏️ Modifier la diligence
            </button>
          )}
          {isAdmin && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              onMouseEnter={() => setHoverDel(true)}
              onMouseLeave={() => setHoverDel(false)}
              style={{
                width: '100%', padding: '12px 0',
                background: hoverDel ? ALERT_RED : '#FEF2F2',
                color: hoverDel ? C.blanc : ALERT_RED,
                border: `1.5px solid ${ALERT_RED}`, borderRadius: 12,
                fontWeight: 700, fontSize: 14, cursor: deleting ? 'not-allowed' : 'pointer',
                boxShadow: hoverDel ? `0 6px 20px ${ALERT_RED}40` : 'none',
                transition: 'all .2s',
              }}
            >
              {deleting ? 'Suppression…' : '🗑️ Supprimer la diligence'}
            </button>
          )}
        </div>
      </div>

      {modalEdit && (
        <EditModal diligence={diligence} setDiligences={setDiligences} onClose={() => setModalEdit(false)} />
      )}
    </div>
  );
}

function EditModal({ diligence, setDiligences, onClose }) {
  const [intitule, setIntitule] = useState(diligence.intitule);
  const [imputeA, setImputeA]   = useState(Array.isArray(diligence.imputeA) ? diligence.imputeA : []);
  const [echeance, setEcheance] = useState(diligence.echeance || '');
  const [description, setDesc]  = useState(diligence.description || '');
  const [statut, setStatut]     = useState(diligence.statut);
  const [progression, setProg]  = useState(diligence.progression ?? 0);
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState('');

  const handleStatutChange = (v) => {
    setStatut(v);
    if (v === 'executee') setProg(100);
  };

  const save = async () => {
    if (!intitule.trim()) { setErr("L'objet est requis."); return; }
    setSaving(true);
    const finalIntitule = statut === 'executee' ? stripOrderNum(intitule.trim()) : intitule.trim();
    const finalProg     = statut === 'executee' ? 100 : Number(progression);
    const updates = {
      intitule: finalIntitule, impute_a: imputeA, echeance,
      description, statut, progression: finalProg,
    };
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
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.sec, marginBottom: 4 }}>
          Taux de réalisation : <span style={{ color: C.vert, fontWeight: 800 }}>{progression}%</span>
        </label>
        <input type="range" min={0} max={100} value={progression}
          onChange={e => setProg(e.target.value)}
          style={{ width: '100%', accentColor: C.vert }} />
      </div>
      <Input label="Date d'échéance" value={echeance} onChange={setEcheance} type="date" />
      <Textarea label="Description" value={description} onChange={setDesc} rows={3} />
      {err && <div style={{ color: C.urg, fontSize: 12, marginBottom: 10 }}>{err}</div>}
      <Btn onClick={save} full disabled={saving} style={{ fontWeight: 700 }}>
        {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
      </Btn>
    </Modal>
  );
}
