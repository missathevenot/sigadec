import { C } from '../../constants/colors';
import { MOIS_NOMS } from '../../constants/mois';

export default function YearMonthFilter({ year, setYear, month, setMonth }) {
  const years = [2024, 2025, 2026];
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {years.map(y => (
          <button
            key={y}
            onClick={() => setYear(year === y ? null : y)}
            style={{
              padding: '5px 12px', borderRadius: 18, fontSize: 12, fontWeight: 600,
              border: `1.5px solid ${year === y ? C.vert : C.bord}`,
              background: year === y ? C.vertL : C.blanc,
              color: year === y ? C.vert : C.sec,
              cursor: 'pointer',
            }}
          >
            {y}
          </button>
        ))}
      </div>
      <select
        value={month || ''}
        onChange={e => setMonth(e.target.value ? Number(e.target.value) : null)}
        style={{
          border: `1.5px solid ${C.bord}`, borderRadius: 18,
          padding: '5px 10px', fontSize: 12, color: month ? C.txt : C.sec,
          background: C.blanc, outline: 'none', cursor: 'pointer',
        }}
      >
        <option value="">Tous les mois</option>
        {MOIS_NOMS.map((m, i) => (
          <option key={i} value={i + 1}>{m}</option>
        ))}
      </select>
    </div>
  );
}
