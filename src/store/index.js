import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import {
  mapUser, mapDiligence, mapCourrier, mapInfo, mapRapport,
  mapCharte, mapEmission, mapRecette, mapPlanningCharteRows,
} from '../lib/mappers';
import { buildCRPlanning } from '../data/plannings';

export const useStore = create((set) => ({
  // Auth
  user: null,
  setUser: (user) => set({ user }),

  // Navigation
  page: 'dashboard',
  pageParams: {},
  navigate: (page, params = {}) => set({ page, pageParams: params }),

  // Data (vide au départ, chargé depuis Supabase)
  diligences:     [],
  courriers:      [],
  infos:          [],
  rapports:       [],
  chartes:        [],
  emissions:      [],
  recettes:       [],
  planningCharte: {},
  planningCR:     buildCRPlanning(),
  notifications:  [],
  users:          [],
  loading:        true,

  // Chargement initial depuis Supabase
  initialize: async () => {
    set({ loading: true });
    const [
      { data: dils },
      { data: cous },
      { data: infs },
      { data: raps },
      { data: chars },
      { data: emis },
      { data: recs },
      { data: usrs },
      { data: plan },
    ] = await Promise.all([
      supabase.from('diligences').select('*').order('date_submission', { ascending: false }),
      supabase.from('courriers').select('*').order('date_emission', { ascending: false }),
      supabase.from('infos').select('*').order('date_submission', { ascending: false }),
      supabase.from('rapports').select('*').order('date_submission', { ascending: false }),
      supabase.from('chartes').select('*').order('date', { ascending: false }),
      supabase.from('emissions').select('*').order('date', { ascending: false }),
      supabase.from('recettes').select('*').order('date', { ascending: false }),
      supabase.from('utilisateurs').select('*'),
      supabase.from('planning_charte').select('*').order('mois'),
    ]);
    set({
      diligences:     (dils  || []).map(mapDiligence),
      courriers:      (cous  || []).map(mapCourrier),
      infos:          (infs  || []).map(mapInfo),
      rapports:       (raps  || []).map(mapRapport),
      chartes:        (chars || []).map(mapCharte),
      emissions:      (emis  || []).map(mapEmission),
      recettes:       (recs  || []).map(mapRecette),
      users:          (usrs  || []).map(mapUser),
      planningCharte: mapPlanningCharteRows(plan || []),
      loading:        false,
    });
  },

  // Setters locaux (état session)
  setDiligences:     (fn) => set(s => ({ diligences:     typeof fn === 'function' ? fn(s.diligences)     : fn })),
  setCourriers:      (fn) => set(s => ({ courriers:      typeof fn === 'function' ? fn(s.courriers)      : fn })),
  setInfos:          (fn) => set(s => ({ infos:          typeof fn === 'function' ? fn(s.infos)          : fn })),
  setRapports:       (fn) => set(s => ({ rapports:       typeof fn === 'function' ? fn(s.rapports)       : fn })),
  setChartes:        (fn) => set(s => ({ chartes:        typeof fn === 'function' ? fn(s.chartes)        : fn })),
  setEmissions:      (fn) => set(s => ({ emissions:      typeof fn === 'function' ? fn(s.emissions)      : fn })),
  setRecettes:       (fn) => set(s => ({ recettes:       typeof fn === 'function' ? fn(s.recettes)       : fn })),
  setPlanningCharte: (fn) => set(s => ({ planningCharte: typeof fn === 'function' ? fn(s.planningCharte) : fn })),
  setPlanningCR:     (fn) => set(s => ({ planningCR:     typeof fn === 'function' ? fn(s.planningCR)     : fn })),
  setNotifications:  (fn) => set(s => ({ notifications:  typeof fn === 'function' ? fn(s.notifications)  : fn })),
  setUsers:          (fn) => set(s => ({ users:          typeof fn === 'function' ? fn(s.users)          : fn })),
}));
