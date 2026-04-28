export const matchSearch = (item, q) => {
  if (!q) return true;
  const s = q.toLowerCase();
  return (item.reference || '').toLowerCase().includes(s)
    || (item.objet || item.titre || item.intitule || '').toLowerCase().includes(s);
};
