import { useState, useCallback, useEffect } from 'react';
import { useStore } from './store';
import { canReadEmiRec } from './utils/access';

import SplashScreen    from './components/layout/SplashScreen';
import TopBar          from './components/layout/TopBar';
import BottomNav       from './components/layout/BottomNav';
import AppDrawer       from './components/layout/AppDrawer';
import AuthFlow        from './pages/auth/AuthFlow';

import Dashboard       from './pages/Dashboard';
import MonEspace       from './pages/MonEspace';
import DiligencesPage  from './pages/diligences/DiligencesPage';
import DiligenceDetail from './pages/diligences/DiligenceDetail';
import InfosPage       from './pages/infos/InfosPage';
import RapportsPage    from './pages/documentation/RapportsPage';
import ChartesPage     from './pages/chartes/ChartesPage';
import PlanningPage    from './pages/planning/PlanningPage';
import CourriersPage   from './pages/courriers/CourriersPage';
import CourrierDetail  from './pages/courriers/CourrierDetail';
import EmiRecPage      from './pages/emi-rec/EmiRecPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import ProfilePage     from './pages/profile/ProfilePage';
import AdminPage       from './pages/admin/AdminPage';

export default function App() {
  const {
    user, setUser, page, pageParams, navigate,
    diligences, setDiligences, courriers, setCourriers,
    infos, setInfos, rapports, setRapports,
    chartes, setChartes, emissions, setEmissions, recettes, setRecettes,
    planningCharte, setPlanningCharte, planningCR, setPlanningCR,
    notifications, setNotifications, initialize,
  } = useStore();

  const [splash, setSplash]     = useState(true);
  const [drawerOpen, setDrawer] = useState(false);

  useEffect(() => { initialize(); }, []);

  const handleSplashDone = useCallback(() => setSplash(false), []);
  const unread = notifications.filter(n => !n.lu).length;

  const handleLogout = () => {
    setUser(null);
    useStore.setState({ page: 'dashboard', pageParams: {} });
  };

  if (splash) return <SplashScreen onDone={handleSplashDone} />;
  if (!user)  return <AuthFlow />;

  const sp = { user, planningCharte, setPlanningCharte, planningCR, setPlanningCR };

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
      />

      <main style={{ overflowY: 'auto', paddingBottom: 72, paddingTop: 58 }}>
        {page === 'dashboard'          && <Dashboard {...sp} diligences={diligences} rapports={rapports} chartes={chartes} courriers={courriers} notifications={notifications} infos={infos} emissions={emissions} recettes={recettes} navigate={navigate} />}
        {page === 'mon-espace'         && <MonEspace {...sp} diligences={diligences} rapports={rapports} chartes={chartes} courriers={courriers} infos={infos} emissions={emissions} recettes={recettes} navigate={navigate} />}
        {page === 'infos'              && <InfosPage infos={infos} setInfos={setInfos} diligences={diligences} setDiligences={setDiligences} user={user} navigate={navigate} />}
        {page === 'diligences'         && user.role !== 'secretariat' && <DiligencesPage diligences={diligences} setDiligences={setDiligences} courriers={courriers} setCourriers={setCourriers} user={user} navigate={navigate} />}
        {page === 'diligence-detail'   && user.role !== 'secretariat' && <DiligenceDetail diligence={diligences.find(d => d.id === pageParams.id)} diligences={diligences} setDiligences={setDiligences} courriers={courriers} setCourriers={setCourriers} user={user} navigate={navigate} />}
        {page === 'rapports'           && <RapportsPage rapports={rapports} setRapports={setRapports} user={user} />}
        {page === 'chartes'            && user.role !== 'secretariat' && <ChartesPage chartes={chartes} setChartes={setChartes} user={user} planningCharte={planningCharte} setPlanningCharte={setPlanningCharte} />}
        {page === 'planning'           && user.role !== 'secretariat' && <PlanningPage {...sp} />}
        {page === 'courriers'          && <CourriersPage courriers={courriers} setCourriers={setCourriers} user={user} navigate={navigate} />}
        {page === 'courrier-detail'    && <CourrierDetail courrier={courriers.find(c => c.id === pageParams.id)} courriers={courriers} setCourriers={setCourriers} user={user} navigate={navigate} />}
        {page === 'emi-rec'            && canReadEmiRec(user) && <EmiRecPage user={user} emissions={emissions} setEmissions={setEmissions} recettes={recettes} setRecettes={setRecettes} />}
        {page === 'notifications'      && <NotificationsPage notifications={notifications} setNotifications={setNotifications} />}
        {page === 'profile'            && <ProfilePage user={user} />}
        {page === 'admin'              && ['admin','directeur'].includes(user.role) && <AdminPage />}
      </main>

      <BottomNav page={page} navigate={navigate} user={user} />
    </div>
  );
}
