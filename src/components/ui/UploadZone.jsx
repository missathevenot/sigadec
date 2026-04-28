import { C } from '../../constants/colors';

export default function UploadZone({ label, fichierNom, setFichierNom, required = false }) {
  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setFichierNom(file.name);
  };
  return (
    <div style={{ marginBottom: 12 }}>
      {label && (
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.sec, marginBottom: 4 }}>
          {label}{required && <span style={{ color: C.urg }}> *</span>}
        </label>
      )}
      <label style={{
        display: 'flex', alignItems: 'center', gap: 10,
        border: `1.5px dashed ${C.bord}`,
        borderRadius: 9, padding: '10px 14px',
        cursor: 'pointer', background: C.bg,
      }}>
        <span style={{ fontSize: 20 }}>📎</span>
        <span style={{ fontSize: 13, color: fichierNom ? C.txt : C.sec }}>
          {fichierNom || 'Sélectionner un fichier…'}
        </span>
        <input type="file" style={{ display: 'none' }} onChange={handleChange} />
      </label>
      {fichierNom && (
        <button onClick={() => setFichierNom('')} style={{ fontSize: 11, color: C.urg, background: 'none', border: 'none', cursor: 'pointer', marginTop: 4 }}>
          Supprimer
        </button>
      )}
    </div>
  );
}
