import { SERVICES } from '../constants/services';
import { isoWeek } from '../utils/refs';

export const PLANNING_CHARTE_INIT = {
  1:  { mois:'Janvier',   serviceId:'s12', chefId:'u21', soumis:true,  dateSoumis:'2026-01-17' },
  2:  { mois:'Février',   serviceId:'s1',  chefId:'u10', soumis:true,  dateSoumis:'2026-02-21' },
  3:  { mois:'Mars',      serviceId:'s9',  chefId:'u18', soumis:true,  dateSoumis:'2026-03-20' },
  4:  { mois:'Avril',     serviceId:'s3',  chefId:'u12', soumis:false, dateSoumis:null },
  5:  { mois:'Mai',       serviceId:'s6',  chefId:'u15', soumis:false, dateSoumis:null },
  6:  { mois:'Juin',      serviceId:'s0',  chefId:'u9',  soumis:false, dateSoumis:null },
  7:  { mois:'Juillet',   serviceId:'s13', chefId:'u22', soumis:false, dateSoumis:null },
  8:  { mois:'Août',      serviceId:'s4',  chefId:'u13', soumis:false, dateSoumis:null },
  9:  { mois:'Septembre', serviceId:'s11', chefId:'u20', soumis:false, dateSoumis:null },
  10: { mois:'Octobre',   serviceId:'s2',  chefId:'u11', soumis:false, dateSoumis:null },
  11: { mois:'Novembre',  serviceId:'s7',  chefId:'u16', soumis:false, dateSoumis:null },
  12: { mois:'Décembre',  serviceId:'s14', chefId:'u23', soumis:false, dateSoumis:null },
};

export function buildCRPlanning() {
  const plan = {};
  const total = SERVICES.length;
  for (let w = 1; w <= 52; w++) {
    const svc = SERVICES[w % total];
    plan[w] = { serviceId: svc.id, semaine: w };
  }
  return plan;
}

export const MOIS_COURANT    = new Date().getMonth() + 1;
export const SEMAINE_COURANTE = isoWeek(new Date());
