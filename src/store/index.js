import { create } from 'zustand';
import { MOCK_DILIGENCES }  from '../data/mockDiligences';
import { MOCK_COURRIERS }   from '../data/mockCourriers';
import { MOCK_INFOS }       from '../data/mockInfos';
import { MOCK_RAPPORTS }    from '../data/mockRapports';
import { MOCK_CHARTES }     from '../data/mockChartes';
import { MOCK_EMISSIONS }   from '../data/mockEmissions';
import { MOCK_RECETTES }    from '../data/mockRecettes';
import { PLANNING_CHARTE_INIT, buildCRPlanning } from '../data/plannings';
import { USERS }            from '../constants/users';

export const useStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),

  page: 'dashboard',
  pageParams: {},
  navigate: (page, params = {}) => set({ page, pageParams: params }),

  diligences:     MOCK_DILIGENCES,
  courriers:      MOCK_COURRIERS,
  infos:          MOCK_INFOS,
  rapports:       MOCK_RAPPORTS,
  chartes:        MOCK_CHARTES,
  emissions:      MOCK_EMISSIONS,
  recettes:       MOCK_RECETTES,
  planningCharte: PLANNING_CHARTE_INIT,
  planningCR:     buildCRPlanning(),
  notifications:  [],
  users:          USERS,

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
