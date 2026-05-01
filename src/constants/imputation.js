// Liste officielle des mentions pour "Imputée à" / "Imputé à"
export const IMPUTE_LABELS = [
  'CT COMOE',
  'CT TIMITEY',
  'SD DIOMANDE',
  'SD DOUMBIA',
  'SD BLON',
  'SD KONE',
  'SPSTC',
  'SESC',
  'SSPDDA',
  'SCR (Réseaux)',
  'SDIC',
  'SVRC',
  'SEFR',
  'SEI',
  'SCOAIF',
  'SARIF',
  'SCR (Contentieux)',
  'SCAFR',
  'SEP',
  'SCTF',
  'SAFIC',
];

export const IMPUTE_OPTIONS   = IMPUTE_LABELS.map(v => ({ value: v, label: v }));
export const EMIS_PAR_OPTIONS = [{ value: 'DCAD', label: 'DCAD' }, ...IMPUTE_OPTIONS];
