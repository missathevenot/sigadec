export const canWriteEmissions = u => u?.serviceId === 's3' || u?.role === 'admin';
export const canWriteRecettes  = u => u?.serviceId === 's4' || u?.role === 'admin';
export const canDeleteEmiRec   = u => u?.role === 'admin';
export const canReadEmiRec     = u => true; // Visible par tous les utilisateurs
