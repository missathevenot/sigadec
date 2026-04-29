// Supabase snake_case → app camelCase
export const mapUser = (u) => ({
  id: u.id, prenom: u.prenom, nom: u.nom, email: u.email,
  role: u.role, serviceId: u.service_id, statut: u.statut,
  motDePasse: u.mot_de_passe || null,
  photoUrl: u.photo_url || null,
});

export const mapDiligence = (d) => ({
  id: d.id, reference: d.reference, intitule: d.intitule,
  assigneA: d.assigne_a, serviceIds: d.service_ids || [],
  imputeA: d.impute_a || '',
  statut: d.statut, progression: d.progression,
  dateSubmission: d.date_submission, echeance: d.echeance,
  description: d.description || '', courrierIds: d.courrier_ids || [],
  objetDoc: d.objet_doc || '', fichierNom: d.fichier_nom || '',
  historique: d.historique || [], dateReport: d.date_report,
  facteursReport: d.facteurs_report,
});

export const mapCourrier = (c) => ({
  id: c.id, reference: c.reference, sens: c.sens, objet: c.objet,
  dateEmission: c.date_emission, partenaire: c.partenaire || '',
  structureEmettrice: c.structure_emettrice || '', statut: c.statut,
  joursAttente: c.jours_attente || 0, serviceEmetteurId: c.service_emetteur_id,
  assigneARoleId: c.assigne_a_role_id, corps: c.corps || '',
  noteInterne: c.note_interne || '', relances: c.relances || [],
  objetDoc: c.objet_doc || '', fichierNom: c.fichier_nom || '',
  imputeA: c.impute_a || '',
  emisPar: c.emis_par || '',
});

export const mapInfo = (i) => ({
  id: i.id, reference: i.reference, titre: i.titre, statut: i.statut,
  dateSubmission: i.date_submission, date: i.date,
  description: i.description || '', auteurId: i.auteur_id,
  serviceIds: i.service_ids || [], dilIds: i.dil_ids || [],
  objetDoc: i.objet_doc || '', fichierNom: i.fichier_nom || '',
});

export const mapRapport = (r) => ({
  id: r.id, reference: r.reference, objet: r.objet, titre: r.titre,
  type: r.type, serviceId: r.service_id, annee: r.annee,
  semaine: r.semaine, moisDoc: r.mois_doc, auteur: r.auteur,
  resume: r.resume || '', dateSubmission: r.date_submission,
  createdAt: r.created_at,
});

export const mapCharte = (c) => ({
  id: c.id, mois: c.mois, annee: c.annee, serviceId: c.service_id,
  principe: c.principe, resume: c.resume || '', auteur: c.auteur, date: c.date,
});

export const mapEmission = (e) => ({
  id: e.id, reference: e.reference, objet: e.objet, date: e.date,
  description: e.description || '', fichierNom: e.fichier_nom || '', auteurId: e.auteur_id,
});

export const mapRecette = (r) => ({
  id: r.id, reference: r.reference, objet: r.objet, date: r.date,
  description: r.description || '', fichierNom: r.fichier_nom || '', auteurId: r.auteur_id,
});

export const mapPlanningCharteRows = (rows) => {
  const plan = {};
  (rows || []).forEach(r => {
    plan[r.mois] = {
      mois: r.mois_nom, serviceId: r.service_id,
      chefId: r.chef_id, soumis: r.soumis || false,
      dateSoumis: r.date_soumis,
      principe: r.principe || '',
    };
  });
  return plan;
};

export const mapPlanningCRRows = (rows, basePlan) => {
  const plan = { ...basePlan };
  (rows || []).forEach(r => {
    plan[r.semaine] = {
      ...plan[r.semaine],
      serviceId:   r.service_id  || plan[r.semaine]?.serviceId,
      datePrevue:  r.date_prevue || null,
      description: r.description || '',
    };
  });
  return plan;
};

// App camelCase → Supabase snake_case
export const diligenceToDb = (d) => ({
  id: d.id, reference: d.reference, intitule: d.intitule,
  assigne_a: d.assigneA, service_ids: d.serviceIds,
  impute_a: d.imputeA || null,
  statut: d.statut, progression: d.progression,
  date_submission: d.dateSubmission, echeance: d.echeance,
  description: d.description, courrier_ids: d.courrierIds,
  objet_doc: d.objetDoc, fichier_nom: d.fichierNom,
  historique: d.historique, date_report: d.dateReport,
  facteurs_report: d.facteursReport,
});

export const courrierToDb = (c) => ({
  id: c.id, reference: c.reference, sens: c.sens, objet: c.objet,
  date_emission: c.dateEmission, partenaire: c.partenaire,
  structure_emettrice: c.structureEmettrice, statut: c.statut,
  jours_attente: c.joursAttente, service_emetteur_id: c.serviceEmetteurId,
  assigne_a_role_id: c.assigneARoleId, corps: c.corps,
  note_interne: c.noteInterne, relances: c.relances,
  objet_doc: c.objetDoc, fichier_nom: c.fichierNom,
  impute_a: c.imputeA || null,
  emis_par: c.emisPar || null,
});

export const infoToDb = (i) => ({
  id: i.id, reference: i.reference, titre: i.titre, statut: i.statut,
  date_submission: i.dateSubmission, date: i.date, description: i.description,
  auteur_id: i.auteurId, service_ids: i.serviceIds, dil_ids: i.dilIds,
  objet_doc: i.objetDoc, fichier_nom: i.fichierNom,
});

export const rapportToDb = (r) => ({
  id: r.id, reference: r.reference, objet: r.objet, titre: r.titre,
  type: r.type, service_id: r.serviceId, annee: r.annee,
  semaine: r.semaine, mois_doc: r.moisDoc, auteur: r.auteur,
  resume: r.resume, date_submission: r.dateSubmission,
});

export const charteToDb = (c) => ({
  id: c.id, mois: c.mois, annee: c.annee, service_id: c.serviceId,
  principe: c.principe, resume: c.resume, auteur: c.auteur, date: c.date,
});

export const emissionToDb = (e) => ({
  id: e.id, reference: e.reference, objet: e.objet, date: e.date,
  description: e.description, fichier_nom: e.fichierNom, auteur_id: e.auteurId,
});

export const recetteToDb = (r) => ({
  id: r.id, reference: r.reference, objet: r.objet, date: r.date,
  description: r.description, fichier_nom: r.fichierNom, auteur_id: r.auteurId,
});

export const userToDb = (u) => ({
  id: u.id, prenom: u.prenom, nom: u.nom, email: u.email,
  role: u.role, service_id: u.serviceId, statut: u.statut,
  photo_url: u.photoUrl || null,
});
