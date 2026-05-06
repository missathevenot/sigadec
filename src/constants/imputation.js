// Valeurs stockées (clé courte) + libellés complets pour la liste déroulante
export const IMPUTE_OPTIONS = [
  { value: 'CT COMOE',          label: 'CT COMOE' },
  { value: 'CT TIMITEY',        label: 'CT TIMITEY' },
  { value: 'SD DIOMANDE',       label: 'SD DIOMANDE' },
  { value: 'SD DOUMBIA',        label: 'SD DOUMBIA' },
  { value: 'SD BLON',           label: 'SD BLON' },
  { value: 'SD KONE',           label: 'SD KONE' },
  { value: 'SPSTC',             label: 'SPSTC - Service de la Prospection et du Suivi-évaluation des Travaux Cadastraux' },
  { value: 'SESC',              label: 'SESC - Service des Études et des Statistiques Cadastrales' },
  { value: 'SSPDDA',            label: 'SSPDDA - Service du Suivi des Projets Digitaux' },
  { value: 'SCR (Réseaux)',     label: 'SCR - Service du Cadastre de Réseaux' },
  { value: 'SDIC',              label: 'SDIC - Service de la Documentation et de l\'Information Cadastrale' },
  { value: 'SVRC',              label: 'SVRC - Service des Valeurs de Références Cadastrales' },
  { value: 'SEFR',              label: 'SEFR - Service des Enquêtes Foncières et du Recoupement' },
  { value: 'SEI',               label: 'SEI - Service des Evaluations Immobilières' },
  { value: 'SCOAIF',            label: 'SCOAIF - Service de la Coordination des Opérations d\'Assiette de l\'Impôt Foncier' },
  { value: 'SARIF',             label: 'SARIF - Service d\'Appui au Recouvrement de l\'Impôt Foncier' },
  { value: 'SCR (Contentieux)', label: 'SCR - Service des Contentieux et des Réformes' },
  { value: 'SCAFR',             label: 'SCAFR - Service de la Coordination des Activités Foncières Rurales' },
  { value: 'SEP',               label: 'SEP - Service de l\'Equipement et de la Production' },
  { value: 'SCTF',              label: 'SCTF - Service de la Coordination des Travaux Foncier' },
  { value: 'SAFIC',             label: 'SAFIC - Service des Applicatifs de la Fiscalité Immobilière et Cadastrale' },
];

export const IMPUTE_LABELS    = IMPUTE_OPTIONS.map(o => o.value);
export const EMIS_PAR_OPTIONS = [{ value: 'DCAD', label: 'DCAD' }, ...IMPUTE_OPTIONS];

// ── Mapping email → valeur d'imputation (prioritaire, précis, basé sur le compte réel) ──
export const EMAIL_TO_IMPUTE_VALUE = {
  'luciencomoe@gmail.com':        'CT COMOE',
  'maurytimset@gmail.com':        'CT TIMITEY',
  'ksoultoh@yahoo.fr':            'SD KONE',
  'doumleyz@yahoo.fr':            'SD DOUMBIA',
  'blonadolf@gmail.com':          'SD BLON',
  'messdiomande@hotmail.com':     'SD DIOMANDE',
  'kosline2005@gmail.com':        'SCAFR',
  'missathevenot@gmail.com':      'SSPDDA',
  'seristephane79@gmail.com':     'SCR (Contentieux)',
  'thiemele.mc@gmail.com':        'SEFR',
  'mayouboris2dgi.scr@gmail.com': 'SCR (Réseaux)',
  'blegnonjp@gmail.com':          'SCOAIF',
  'hiabituehi@gmail.com':         'SCTF',
  'mahethomas68@gmail.com':       'SPSTC',
  'ykcvrin@gmail.com':            'SDIC',
  'amanislater@gmail.com':        'SEI',
  'wanafulgence@gmail.com':       'SVRC',
};

// Mapping serviceId → valeur d'imputation correspondante
export const SERVICE_TO_IMPUTE_VALUE = {
  's0':  'SAFIC',
  's1':  'SPSTC',
  's2':  'SESC',
  's3':  'SCOAIF',
  's4':  'SARIF',
  's5':  'SCR (Contentieux)',
  's6':  'SCTF',
  's7':  'SCAFR',
  's8':  'SEP',
  's9':  'SDIC',
  's10': 'SSPDDA',
  's11': 'SCR (Réseaux)',
  's12': 'SEI',
  's13': 'SEFR',
  's14': 'SVRC',
};

// Sous-Directions disponibles dans Documentation
export const SOUS_DIR_OPTIONS = [
  { value: 'SD Information Cadastrale',            label: 'SD Information Cadastrale' },
  { value: 'SD Assiette et du Contrôle IF',        label: 'SD Assiette et du Contrôle IF' },
  { value: 'SD Production, Travaux Fonciers',      label: 'SD Production, Travaux Fonciers' },
  { value: 'SD Evaluation, Expertise Immobilière', label: 'SD Evaluation, Expertise Immobilière' },
];

/**
 * Retourne le libellé IMPUTE complet pour un serviceId
 * (ex: 'SCR - Service du Cadastre de Réseaux')
 */
export function getImputeLabelForService(serviceId) {
  const val = SERVICE_TO_IMPUTE_VALUE[serviceId];
  if (!val) return null;
  return IMPUTE_OPTIONS.find(o => o.value === val)?.label || val;
}

/**
 * Retourne les identifiants d'imputation correspondant à un utilisateur.
 * Utilisé pour filtrer les diligences/rapports imputés à cet utilisateur.
 *
 * Priorité :
 *  1. Mapping email → valeur (précis, basé sur le compte réel)
 *  2. Mapping serviceId → valeur (chef de service sans email listé)
 *  3. Fallback rôle + nom (compatibilité anciens comptes)
 */
export function getUserImputeIds(user) {
  if (!user) return [];

  // 1. Email-based lookup (prioritaire — couvre tous les comptes réels connus)
  if (user.email) {
    const emailVal = EMAIL_TO_IMPUTE_VALUE[user.email.toLowerCase()];
    if (emailVal) return [emailVal];
  }

  const ids = [];

  // 2. serviceId → valeur d'imputation (chef de service non listé dans le mapping email)
  if (user.serviceId && SERVICE_TO_IMPUTE_VALUE[user.serviceId]) {
    ids.push(SERVICE_TO_IMPUTE_VALUE[user.serviceId]);
  }

  // 3. Fallback rôle + nom (conseillers tech / sous-directeurs sans email reconnu)
  if (user.role === 'conseiller_tech') {
    const n = (user.nom || '').toUpperCase();
    if (n.includes('COMOE'))   ids.push('CT COMOE');
    if (n.includes('TIMITEY')) ids.push('CT TIMITEY');
  }
  if (user.role === 'sous_directeur') {
    const n = (user.nom || '').toUpperCase();
    if (n.includes('DIOMANDE')) ids.push('SD DIOMANDE');
    if (n.includes('DOUMBIA'))  ids.push('SD DOUMBIA');
    if (n.includes('BLON'))     ids.push('SD BLON');
    if (n.includes('KONE'))     ids.push('SD KONE');
  }

  return [...new Set(ids)]; // dédoublonnage
}
