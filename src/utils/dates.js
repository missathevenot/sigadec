export const fmtDate = d =>
  d ? new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', {
    day:'2-digit', month:'short', year:'numeric'
  }) : '—';

export const fmtRel = d => {
  const n = Math.floor((Date.now() - new Date(d)) / 86400000);
  return n === 0 ? "Aujourd'hui" : n === 1 ? 'Hier' : `Il y a ${n}j`;
};

export const today = () => new Date().toISOString().split('T')[0];
