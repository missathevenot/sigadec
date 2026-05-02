import { useState, useCallback, useEffect } from 'react';
import { useStore } from './store';
import { useResponsive } from './hooks/useResponsive';
import { canReadEmiRec } from './utils/access';
import { supabase } from './lib/supabase';

import SplashScreen    from './components/layout/SplashScreen';
import TopBar, { TOP_BAR_HEIGHT } from './components/layout/TopBar';
import BottomNav       from './components/layout/BottomNav';
import SideNav         from './components/layout/SideNav';
import AppDrawer       from './components/layout/AppDrawer';
import AuthFlow        from './pages/auth/AuthFlow';

import Dashboard       from './pages/Dashboard';
import MonEspace       from './pages/MonEspace';
import DiligencesPage  from './pages/diligences/DiligencesPage';
import DiligenceDetail from './pages/diligences/DiligenceDetail';
import InfosPage       from './pages/infos/InfosPage';
import RapportsPage    from './pages/documentation/RapportsPage';
import PlanningPage    from './pages/planning/PlanningPage';
import CourriersPage   from './pages/courriers/CourriersPage';
import CourrierDetail  from './pages/courriers/CourrierDetail';
import EmiRecPage      from './pages/emi-rec/EmiRecPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import ProfilePage     from './pages/profile/ProfilePage';
import AdminPage       from './pages/admin/AdminPage';

export default function App() {
  const {
    user, setUser, loading, page, pageParams, navigate,
    diligences, setDiligences, courriers, setCourriers,
    infos, setInfos, rapports, setRapports,
    chartes, setChartes, emissions, setEmissions, recettes, setRecettes,
    planningCharte, setPlanningCharte, planningCR, setPlanningCR,
    notifications, setNotifications, initialize,
  } = useStore();

  const { isMobile }              = useResponsive();
  const [splash, setSplash]       = useState(true);
  const [drawerOpen, setDrawer]   = useState(false);

  useEffect(() => { initialize(); }, []);

  const handleSplashDone = useCallback(() => setSplash(false), []);
  const unread = notifications.filter(n => !n.lu).length;

  const handleLogout = async () => {
    await supabase.auth.signOut(); // efface la session + déclenche onAuthStateChange → user: null
    useStore.setState({ page: 'dashboard', pageParams: {} });
  };

  if (splash) return <SplashScreen onDone={handleSplashDone} />;
  if (loading) return null; // Restauration de session en cours (très bref)
  if (!user)  return <AuthFlow />;

  const sp = { user, planningCharte, setPlanningCharte, planningCR, setPlanningCR };

  const pages = (
    <>
      {page === 'dashboard'          && <Dashboard {...sp} diligences={diligences} rapports={rapports} chartes={chartes} courriers={courriers} notifications={notifications} infos={infos} emissions={emissions} recettes={recettes} navigate={navigate} />}
      {page === 'mon-espace'         && <MonEspace {...sp} diligences={diligences} rapports={rapports} chartes={chartes} courriers={courriers} infos={infos} emissions={emissions} recettes={recettes} navigate={navigate} />}
      {page === 'infos'              && <InfosPage infos={infos} setInfos={setInfos} diligences={diligences} setDiligences={setDiligences} user={user} navigate={navigate} />}
      {page === 'diligences'         && user.role !== 'secretariat' && <DiligencesPage diligences={diligences} setDiligences={setDiligences} courriers={courriers} setCourriers={setCourriers} user={user} navigate={navigate} />}
      {page === 'diligence-detail'   && user.role !== 'secretariat' && <DiligenceDetail diligence={diligences.find(d => d.id === pageParams.id)} diligences={diligences} setDiligences={setDiligences} courriers={courriers} setCourriers={setCourriers} user={user} navigate={navigate} />}
      {page === 'rapports'           && <RapportsPage rapports={rapports} setRapports={setRapports} user={user} />}
      {page === 'planning'           && user.role !== 'secretariat' && <PlanningPage {...sp} rapports={rapports} />}
      {page === 'courriers'          && user.role === 'admin' && <CourriersPage courriers={courriers} setCourriers={setCourriers} user={user} navigate={navigate} />}
      {page === 'courrier-detail'    && user.role === 'admin' && <CourrierDetail courrier={courriers.find(c => c.id === pageParams.id)} courriers={courriers} setCourriers={setCourriers} user={user} navigate={navigate} />}
      {page === 'emi-rec'            && canReadEmiRec(user) && <EmiRecPage user={user} emissions={emissions} setEmissions={setEmissions} recettes={recettes} setRecettes={setRecettes} />}
      {page === 'notifications'      && <NotificationsPage notifications={notifications} setNotifications={setNotifications} />}
      {page === 'profile'            && <ProfilePage user={user} />}
      {page === 'admin'              && ['admin','directeur'].includes(user.role) && <AdminPage />}
    </>
  );

  /* ── Layout MOBILE ── */
  if (isMobile) {
    return (
      <div style={{ background: '#F4F6F9', minHeight: '100vh', maxWidth: 430, margin: '0 auto', position: 'relative' }}>
        {drawerOpen && (
          <div
            onClick={() => setDrawer(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 40, maxWidth: 430, margin: '0 auto' }}
          />
        )}
        <AppDrawer
          open={drawerOpen}
          user={user}
          navigate={navigate}
          onClose={() => setDrawer(false)}
          onLogout={handleLogout}
          currentPage={page}
        />
        <TopBar
          page={page}
          unread={unread}
          onMenu={() => setDrawer(true)}
          onBell={() => navigate('notifications')}
          isMobile={true}
        />
        <main style={{ overflowY: 'auto', paddingBottom: 72, paddingTop: TOP_BAR_HEIGHT }}>
          {pages}
        </main>
        <BottomNav page={page} navigate={navigate} user={user} />
      </div>
    );
  }

  /* ── Layout DESKTOP ── */
  return (
    <div style={{ background: '#F4F6F9', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopBar
        page={page}
        unread={unread}
        onBell={() => navigate('notifications')}
        isMobile={false}
      />
      <div style={{ display: 'flex', flex: 1, paddingTop: TOP_BAR_HEIGHT }}>
        <SideNav
          user={user}
          navigate={navigate}
          currentPage={page}
          onLogout={handleLogout}
          unread={unread}
        />
        <main style={{
          flex: 1,
          marginLeft: 240,
          minHeight: 'calc(100vh - 58px)',
          overflowY: 'auto',
        }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 8px' }}>
            {pages}
          </div>
        </main>
      </div>
    </div>
  );
}
