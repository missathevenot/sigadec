import { SERVICES } from './services';

// Mentions spéciales (CT/SD) + abréviations des services
const SPECIALS = [
  'CT COMOE', 'CT TIMITEY',
  'SD BLON', 'SD', 'SD DIOMANDE', 'SD DOUMBIA', 'SD KONE',
];

// Champ "Imputée à" (diligences) et "Imputé" (courrier reçu)
export const IMPUTE_OPTIONS = [
  ...SPECIALS,
  ...SERVICES.map(s => s.abbr),
].map(v => ({ value: v, label: v }));

// Champ "Emis par" (courrier émis) : DCAD en tête
export const EMIS_PAR_OPTIONS = [
  { value: 'DCAD', label: 'DCAD' },
  ...IMPUTE_OPTIONS,
];
