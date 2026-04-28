export const MOCK_INFOS = [
  {
    id:'inf1', reference:'INFO/2026/Avr/017/01',
    titre:"Réunion comité de direction — vendredi 26 avril",
    statut:'urgent', dateSubmission:'2026-04-22', date:'2026-04-22',
    description:"Réunion obligatoire à 9h en salle de conférence. Ordre du jour : bilan T1.",
    auteurId:'u1', serviceIds:['s3','s12'], dilIds:[],
    objetDoc:'Convocation', fichierNom:'convoc.pdf',
  },
  {
    id:'inf2', reference:'INFO/2026/Avr/017/02',
    titre:"Mise à jour procédures traitement TF — en vigueur 1er mai",
    statut:'actualite', dateSubmission:'2026-04-20', date:'2026-04-20',
    description:"Les procédures révisées entrent en vigueur le 1er mai 2026.",
    auteurId:'u4', serviceIds:['s3'], dilIds:['dil1'],
    objetDoc:'Note de procédure', fichierNom:'proc_tf.pdf',
  },
  {
    id:'inf3', reference:'INFO/2026/Mar/012/01',
    titre:"Fermeture administrative — 1er mai 2026",
    statut:'actualite', dateSubmission:'2026-03-18', date:'2026-03-18',
    description:"La Direction sera fermée le jeudi 1er mai 2026.",
    auteurId:'u8', serviceIds:[], dilIds:[], objetDoc:'', fichierNom:'',
  },
  {
    id:'inf4', reference:'INFO/2026/Fév/007/01',
    titre:"Circulaire DGI sur les TF ruraux (remplacée)",
    statut:'obsolete', dateSubmission:'2026-02-05', date:'2026-02-05',
    description:"Remplacée par la circulaire du 20 avril 2026.",
    auteurId:'u2', serviceIds:[], dilIds:[], objetDoc:'', fichierNom:'',
  },
];
