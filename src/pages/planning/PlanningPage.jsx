import { useState } from 'react';
import { C } from '../../constants/colors';
import { SERVICES } from '../../constants/services';
import { MOIS_NOMS } from '../../constants/mois';
import { fmtDate } from '../../utils/dates';
import Card from '../../components/ui/Card';

export default function PlanningPage({ user, planningCharte, planningCR }) {
  const [onglet, setOnglet] = useState('charte');

  return (
    <div style={{ padding: '14px 14px 0', animation: 'pageIn .22s ease-out' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {[{ v:'charte', l:'Charte Éthique' }, { v:'cr', l:'Comptes Rendus' }].map(t => (
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

      {onglet === 'charte' && (
        <div>
          <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 14, color: C.txt, marginBottom: 10 }}>
            Planning Charte Éthique — 2026
          </div>
          {Object.entries(planningCharte).map(([m, entry]) => {
            const svc = SERVICES.find(s => s.id === entry.serviceId);
            return (
              <Card key={m} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: C.txt }}>{entry.mois}</div>
                    <div style={{ fontSize: 12, color: C.sec, marginTop: 2 }}>{svc?.nom || '—'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {entry.soumis
                      ? <span style={{ color: C.ok, fontWeight: 700, fontSize: 12 }}>✅ Soumis</span>
                      : <span style={{ color: C.orng, fontWeight: 700, fontSize: 12 }}>⏳ En attente</span>
                    }
                    {entry.dateSoumis && <div style={{ fontSize: 10, color: C.sec, marginTop: 2 }}>{fmtDate(entry.dateSoumis)}</div>}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {onglet === 'cr' && (
        <div>
          <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 14, color: C.txt, marginBottom: 10 }}>
            Planning Comptes Rendus — 2026
          </div>
          {Object.entries(planningCR).slice(0, 26).map(([w, entry]) => {
            const svc = SERVICES.find(s => s.id === entry.serviceId);
            return (
              <div key={w} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 12px', borderBottom: `1px solid ${C.bord}`,
                background: C.blanc, borderRadius: 4,
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.txt }}>Semaine {w}</span>
                <span style={{ fontSize: 12, color: C.sec }}>{svc?.abbr || '—'}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
