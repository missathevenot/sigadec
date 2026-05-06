import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import {
  mapUser, mapDiligence, mapCourrier, mapInfo, mapRapport,
  mapCharte, mapEmission, mapRecette, mapPlanningCharteRows, mapPlanningCRRows,
} from '../lib/mappers';
import { buildCRPlanning } from '../data/plannings';
import { buildDailyAlerts } from '../utils/alerts';

/** Marque la session de l'utilisateur comme connectée en base */
async function upsertSession(u) {
  if (!u?.id) return;
  await supabase.from('user_sessions').upsert({
    user_id:         u.id,
    user_email:      u.email,
    user_name:       `${u.prenom} ${u.nom}`,
    role:            u.role,
    service_id:      u.serviceId || null,
    connected_at:    new Date().toISOString(),
    last_seen_at:    new Date().toISOString(),
    disconnected_at: null,
    is_online:       true,
  }, { onConflict: 'user_id' });
}

/** Marque la session de l'utilisateur comme déconnectée en base */
async function closeSession(userId) {
  if (!userId) return;
  await supabase.from('user_sessions').update({
    is_online:       false,
    disconnected_at: new Date().toISOString(),
    last_seen_at:    new Date().toISOString(),
  }).eq('user_id', userId);
}

export const useStore = create((set, get) => ({
  // Auth
  user: null,
  setUser: (user) => set({ user }),

  // Navigation
  page: 'dashboard',
  pageParams: {},
  navigate: (page, params = {}) => set({ page, pageParams: params }),

  // Data
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

  // Chargement initial + restauration de session Supabase Auth
  initialize: async () => {
    set({ loading: true });

    // Écoute les événements Auth (déclenché par signOut depuis n'importe où)
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        const currentUser = get().user;
        if (currentUser?.id) closeSession(currentUser.id); // fire & forget
        set({ user: null, notifications: [] });
      }
    });

    // Vérifie la session persistée (localStorage) pour restaurer automatiquement
    const { data: { session } } = await supabase.auth.getSession();

    // Chargement de toutes les données
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
      { data: plan_cr },
    ] = await Promise.all([
      supabase.from('diligences').select('*').order('date_submission', { ascending: false }),
      supabase.from('courriers').select('*').order('date_emission', { ascending: false }),
      supabase.from('infos').select('*').order('date_submission', { ascending: false }),
      supabase.from('rapports').select('*').order('date_submission', { ascending: false }),
      supabase.from('chartes').select('*').order('date', { ascending: false }),
      supabase.from('emissions').select('*').order('date', { ascending: false }),
      supabase.from('recettes').select('*').order('date', { ascending: false }),
      supabase.from('utilisateurs')
        .select('id, prenom, nom, email, role, service_id, statut, photo_url, auth_migrated'),
      supabase.from('planning_charte').select('*').order('mois'),
      supabase.from('planning_cr').select('*').order('semaine'),
    ]);

    // Restauration de l'utilisateur depuis la session active
    let restoredUser = null;
    if (session?.user?.email) {
      const raw = (usrs || []).find(
        u => u.email?.toLowerCase() === session.user.email.toLowerCase()
      );
      if (raw?.statut === 'actif') {
        restoredUser = mapUser(raw);
        upsertSession(restoredUser); // enregistre la session (fire & forget)
      } else {
        await supabase.auth.signOut();
      }
    }

    // Calcul des alertes avec les données fraîches (si utilisateur actif)
    const freshDils   = (dils || []).map(mapDiligence);
    const freshAlerts = restoredUser ? buildDailyAlerts(freshDils, restoredUser) : [];

    const base = buildCRPlanning();
    set({
      diligences:     freshDils,
      courriers:      (cous  || []).map(mapCourrier),
      infos:          (infs  || []).map(mapInfo),
      rapports:       (raps  || []).map(mapRapport),
      chartes:        (chars || []).map(mapCharte),
      emissions:      (emis  || []).map(mapEmission),
      recettes:       (recs  || []).map(mapRecette),
      users:          (usrs  || []).map(mapUser),
      planningCharte: mapPlanningCharteRows(plan    || []),
      planningCR:     mapPlanningCRRows(plan_cr     || [], base),
      user:           restoredUser,
      notifications:  freshAlerts,
      loading:        false,
    });
  },

  // Setters locaux
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
