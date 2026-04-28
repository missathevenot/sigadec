import { useState } from 'react';
import { C } from '../../constants/colors';
import { SERVICES } from '../../constants/services';
import { PRINCIPES_VALEURS } from '../../constants/principes';
import { MOIS_NOMS } from '../../constants/mois';
import { fmtDate, today } from '../../utils/dates';
import { MOIS_COURANT } from '../../data/plannings';
import Card from '../../components/ui/Card';
import Btn from '../../components/ui/Btn';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import PBar from '../../components/ui/PBar';
import EmptyState from '../../components/ui/EmptyState';

export default function ChartesPage({ chartes, setChartes, user, planningCharte }) {
  const [onglet, setOnglet]   = useState('planning');
  const [modalOpen, setModal] = useState(false);
  const [filterSvc, setFSvc]  = useState('');
  const [filterMois, setFMois] = useState('');

  const canSubmit = user.role !== 'secretariat';

  return (
    <div style={{ padding: '14px 14px 0', animation: 'pageIn .22s ease-out' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {[{ v:'planning', l:'Planning' }, { v:'archives', l:'Archives' }, { v:'suivi', l:'Suivi' }].map(t => (
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

      {onglet === 'planning' && <PlanningView planningCharte={planningCharte} chartes={chartes} />}
      {onglet === 'archives' && <ArchivesView chartes={chartes} filterSvc={filterSvc} setFSvc={setFSvc} filterMois={filterMois} setFMois={setFMois} />}
      {onglet === 'suivi'    && <SuiviView chartes={chartes} planningCharte={planningCharte} />}

      {canSubmit && (
        <div style={{ position: 'sticky', bottom: 80, paddingTop: 10 }}>
          <Btn onClick={() => setModal(true)} full>+ Soumettre une charte</Btn>
        </div>
      )}

      {modalOpen && <SoumettreModal chartes={chartes} setChartes={setChartes} user={user} onClose={() => setModal(false)} />}
    </div>
  );
}

function PlanningView({ planningCharte, chartes }) {
  return (
    <div>
      <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 14, color: C.txt, marginBottom: 10 }}>
        Planning 2026
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
        {Object.entries(planningCharte).map(([m, entry]) => {
          const svc = SERVICES.find(s => s.id === entry.serviceId);
          const moisN = parseInt(m);
          const isCurrent = moisN === MOIS_COURANT;
          return (
            <div key={m} style={{
              background: entry.soumis ? C.vertL : isCurrent ? C.orngL : C.bg,
              borderRadius: 10, padding: '10px 8px', textAlign: 'center',
              border: `1.5px solid ${isCurrent ? C.orng : 'transparent'}`,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.sec }}>{entry.mois.substring(0,3).toUpperCase()}</div>
              <div style={{ fontSize: 18, marginTop: 4 }}>{entry.soumis ? '✅' : isCurrent ? '⏳' : '○'}</div>
              <div style={{ fontSize: 9, color: C.sec, marginTop: 4 }}>{svc?.abbr || '—'}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ArchivesView({ chartes, filterSvc, setFSvc, filterMois, setFMois }) {
  const svcOptions = [{ value: '', label: 'Tous les services' }, ...SERVICES.map(s => ({ value: s.id, label: s.abbr }))];
  const moisOptions = [{ value: '', label: 'Tous les mois' }, ...MOIS_NOMS.map((m, i) => ({ value: String(i+1), label: m }))];

  const filtered = chartes
    .filter(c => {
      if (filterSvc && c.serviceId !== filterSvc) return false;
      if (filterMois && String(c.mois) !== filterMois) return false;
      return true;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <select value={filterSvc} onChange={e => setFSvc(e.target.value)} style={{ flex: 1, border: `1.5px solid ${C.bord}`, borderRadius: 9, padding: '8px 10px', fontSize: 12, outline: 'none' }}>
          {svcOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={filterMois} onChange={e => setFMois(e.target.value)} style={{ flex: 1, border: `1.5px solid ${C.bord}`, borderRadius: 9, padding: '8px 10px', fontSize: 12, outline: 'none' }}>
          {moisOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      {filtered.length === 0
        ? <EmptyState icon="⚖️" title="Aucune charte" />
        : filtered.map(c => {
            const svc = SERVICES.find(s => s.id === c.serviceId);
            return (
              <Card key={c.id} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.vert }}>{svc?.abbr || '—'}</span>
                  <span style={{ fontSize: 11, color: C.sec }}>{MOIS_NOMS[c.mois - 1]} {c.annee}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.txt, marginBottom: 4 }}>{c.principe}</div>
                <div style={{ fontSize: 12, color: C.sec, lineHeight: 1.5 }}>{c.resume}</div>
                <div style={{ fontSize: 11, color: C.sec, marginTop: 6 }}>{c.auteur} · {fmtDate(c.date)}</div>
              </Card>
            );
          })
      }
    </div>
  );
}

function SuiviView({ chartes, planningCharte }) {
  return (
    <div>
      <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 14, color: C.txt, marginBottom: 10 }}>
        Taux de complétion par service
      </div>
      {SERVICES.map(svc => {
        const total = Object.values(planningCharte).filter(p => p.serviceId === svc.id).length;
        const done  = chartes.filter(c => c.serviceId === svc.id).length;
        const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
        return (
          <div key={svc.id} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
              <span style={{ color: C.txt }}>{svc.abbr}</span>
              <span style={{ color: C.sec }}>{done}/{total}</span>
            </div>
            <PBar v={pct} />
          </div>
        );
      })}
    </div>
  );
}

function SoumettreModal({ chartes, setChartes, user, onClose }) {
  const moisCourant = new Date().getMonth() + 1;
  const [mois, setMois]     = useState(String(moisCourant));
  const [serviceId, setSvc] = useState(user.serviceId || '');
  const [dateSoumis, setDate] = useState(today());
  const [principe, setPrincipe] = useState('');
  const [resume, setResume]   = useState('');
  const [err, setErr] = useState('');

  const moisOpts    = MOIS_NOMS.map((m, i) => ({ value: String(i+1), label: m }));
  const svcOpts     = SERVICES.map(s => ({ value: s.id, label: `${s.abbr} — ${s.nom.substring(0, 30)}…` }));
  const principeOpts = PRINCIPES_VALEURS.map(p => ({ value: p, label: p }));

  const submit = () => {
    if (!mois || !serviceId || !dateSoumis || !principe) { setErr('Tous les champs obligatoires sont requis.'); return; }
    const newC = {
      id: `ce${Date.now()}`, mois: Number(mois),
      annee: new Date().getFullYear(), serviceId, principe,
      resume: resume.trim(), auteur: `${user.prenom} ${user.nom}`, date: dateSoumis,
    };
    setChartes(cs => [newC, ...cs]);
    onClose();
  };

  return (
    <Modal title="Soumettre une charte éthique" onClose={onClose}>
      <Select label="Mois" value={mois} onChange={setMois} options={moisOpts} required />
      <Select label="Service" value={serviceId} onChange={setSvc}
        options={user.role === 'chef_service' && user.serviceId
          ? svcOpts.filter(o => o.value === user.serviceId)
          : svcOpts}
        required placeholder="Choisir un service…" />
      <Input label="Date de soumission" value={dateSoumis} onChange={setDate} type="date" required />
      <Select label="Principes et valeurs" value={principe} onChange={setPrincipe} options={principeOpts} required placeholder="Choisir un principe…" />
      <Textarea label="Commentaire / Résumé" value={resume} onChange={setResume} rows={3} />
      {err && <div style={{ color: C.urg, fontSize: 12, marginBottom: 10 }}>{err}</div>}
      <Btn onClick={submit} full>Soumettre</Btn>
    </Modal>
  );
}
