import { C } from './colors';

export const DIL_STATUTS = [
  { v:'en_cours',  l:'En cours',  bg:C.orngL,   c:C.orng },
  { v:'non_echu',  l:'Non Échu',  bg:C.coursB,  c:C.cours },
  { v:'reportee',  l:'Reportée',  bg:'#F0F2F5', c:C.sec },
  { v:'executee',  l:'Exécutée',  bg:C.okB,     c:C.ok },
  { v:'supprimee', l:'Supprimée', bg:'#FEF2F2', c:'#9B9B9B' },
];

export const INFO_STATUTS = [
  { v:'actualite', l:"D'actualité", bg:C.vertL,   c:C.vert },
  { v:'urgent',    l:'Urgent',      bg:C.urgB,    c:C.urg },
  { v:'obsolete',  l:'Obsolète',    bg:'#F0F2F5', c:C.sec },
  { v:'archive',   l:'Archivé',     bg:C.coursB,  c:C.cours },
  { v:'supprime',  l:'Supprimé',    bg:'#FEF2F2', c:'#9B9B9B' },
];

export const CORR_EMIS_STATUTS = [
  { v:'urgent',               l:'🔴 Urgent',                    bg:C.urgB,   c:C.urg },
  { v:'en_cours_redaction',   l:'✏️ En cours de rédaction',      bg:C.orngL,  c:C.orng },
  { v:'attente_signature',    l:'⏳ En attente signature Dcad',  bg:C.coursB, c:C.cours },
  { v:'signe_transmis',       l:'✅ Signé et transmis',          bg:C.okB,    c:C.ok },
  { v:'annule',               l:'❌ Annulé',                     bg:'#F0F2F5',c:C.sec },
];

export const CORR_RECU_STATUTS = [
  { v:'en_attente', l:'En attente', bg:C.orngL,   c:C.orng },
  { v:'repondu',    l:'✓ Répondu',  bg:C.okB,     c:C.ok },
  { v:'archive',    l:'Archivé',    bg:'#F0F2F5', c:C.sec },
  { v:'sans_suite', l:'Sans suite', bg:'#F0F2F5', c:C.sec },
];
