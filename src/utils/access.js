export const canWriteEmissions = u => u?.serviceId === 's3';
export const canWriteRecettes  = u => u?.serviceId === 's4';
export const canReadEmiRec     = u =>
  ['directeur','conseiller_tech','sous_directeur'].includes(u?.role)
  || canWriteEmissions(u)
  || canWriteRecettes(u);
