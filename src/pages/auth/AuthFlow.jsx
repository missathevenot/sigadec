import { useState } from 'react';
import { C } from '../../constants/colors';
import { USERS } from '../../constants/users';
import { ROLES_LABELS, ROLES_SANS_SERVICE } from '../../constants/roles';
import { SERVICES } from '../../constants/services';
import { useStore } from '../../store';
import { buildDailyAlerts } from '../../utils/alerts';
import Logo from '../../components/ui/Logo';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Btn from '../../components/ui/Btn';

export default function AuthFlow() {
  const [view, setView] = useState('login');
  const { setUser, setNotifications, diligences } = useStore();

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, maxWidth: 430, margin: '0 auto' }}>
      {view === 'login'        && <LoginView onRegister={() => setView('register')} setUser={setUser} setNotifications={setNotifications} diligences={diligences} />}
      {view === 'register'     && <RegisterView onBack={() => setView('login')} onDone={() => setView('confirm')} />}
      {view === 'confirm'      && <ConfirmView onBack={() => setView('login')} />}
    </div>
  );
}

function LoginView({ onRegister, setUser, setNotifications, diligences }) {
  const [email, setEmail] = useState('');
  const [err, setErr] = useState('');

  const login = () => {
    const u = USERS.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!u) { setErr('Adresse email inconnue.'); return; }
    if (u.statut !== 'actif') { setErr('Ce compte est en attente de validation.'); return; }
    const alerts = buildDailyAlerts(diligences, u);
    setNotifications(alerts);
    setUser(u);
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Logo size={56} />
        <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: 26, color: C.vert, marginTop: 12 }}>SIGADEC</div>
        <div style={{ fontSize: 12, color: C.sec, marginTop: 4 }}>Direction du Cadastre — DGI CI</div>
      </div>
      <div style={{ background: C.blanc, borderRadius: 14, padding: '24px 20px', boxShadow: '0 1px 6px rgba(0,0,0,.07)' }}>
        <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 18, color: C.txt, marginBottom: 18 }}>Connexion</div>
        <Input label="Adresse email professionnelle" value={email} onChange={setEmail} type="email" placeholder="votre.email@cadastre.dgi.ci" required />
        {err && <div style={{ color: C.urg, fontSize: 12, marginBottom: 10 }}>{err}</div>}
        <Btn onClick={login} full>Se connecter</Btn>
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: C.sec }}>
          Pas encore de compte ?{' '}
          <span onClick={onRegister} style={{ color: C.vert, fontWeight: 700, cursor: 'pointer' }}>S'inscrire</span>
        </div>
      </div>
      <div style={{ marginTop: 16, padding: '12px 14px', background: C.vertL, borderRadius: 10, fontSize: 11, color: C.sec }}>
        <strong>Comptes démo :</strong><br/>
        directeur@cadastre.dgi.ci · admin@cadastre.dgi.ci<br/>
        chef.scoa@cadastre.dgi.ci · secretariat@cadastre.dgi.ci
      </div>
    </div>
  );
}

function RegisterView({ onBack, onDone }) {
  const { setUsers, users } = useStore();
  const [prenom, setPrenom] = useState('');
  const [nom, setNom]       = useState('');
  const [email, setEmail]   = useState('');
  const [role, setRole]     = useState('');
  const [serviceId, setServiceId] = useState('');
  const [err, setErr]       = useState('');

  const roleOptions = Object.entries(ROLES_LABELS).map(([v, l]) => ({ value: v, label: l }));
  const serviceOptions = SERVICES.map(s => ({ value: s.id, label: `${s.abbr} — ${s.nom.substring(0, 35)}…` }));
  const needService = role && !ROLES_SANS_SERVICE.includes(role);

  const submit = () => {
    if (!prenom.trim() || !nom.trim() || !email.trim() || !role) { setErr('Tous les champs obligatoires sont requis.'); return; }
    if (needService && !serviceId) { setErr('Veuillez sélectionner un service.'); return; }
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) { setErr('Cet email est déjà utilisé.'); return; }
    const newUser = {
      id: `u${Date.now()}`, prenom: prenom.trim(), nom: nom.trim(),
      email: email.trim(), role, serviceId: needService ? serviceId : null, statut: 'en_attente',
    };
    setUsers(us => [...us, newUser]);
    onDone();
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ background: C.blanc, borderRadius: 14, padding: '24px 20px', boxShadow: '0 1px 6px rgba(0,0,0,.07)' }}>
        <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 18, color: C.txt, marginBottom: 18 }}>Demande d'inscription</div>
        <Input label="Prénom" value={prenom} onChange={setPrenom} required />
        <Input label="Nom" value={nom} onChange={setNom} required />
        <Input label="Email professionnel" value={email} onChange={setEmail} type="email" required />
        <Select label="Rôle" value={role} onChange={setRole} options={roleOptions} required placeholder="Sélectionner un rôle…" />
        {needService && <Select label="Service" value={serviceId} onChange={setServiceId} options={serviceOptions} required placeholder="Sélectionner un service…" />}
        {err && <div style={{ color: C.urg, fontSize: 12, marginBottom: 10 }}>{err}</div>}
        <Btn onClick={submit} full>Soumettre la demande</Btn>
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <span onClick={onBack} style={{ color: C.sec, fontSize: 13, cursor: 'pointer' }}>← Retour</span>
        </div>
      </div>
    </div>
  );
}

function ConfirmView({ onBack }) {
  return (
    <div style={{ width: '100%', textAlign: 'center' }}>
      <div style={{ background: C.blanc, borderRadius: 14, padding: '32px 20px', boxShadow: '0 1px 6px rgba(0,0,0,.07)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
        <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 18, color: C.txt, marginBottom: 10 }}>Demande envoyée</div>
        <div style={{ fontSize: 14, color: C.sec, lineHeight: 1.6 }}>
          Votre demande d'inscription a été soumise. L'administrateur validera votre compte dans les meilleurs délais.
        </div>
        <div style={{ marginTop: 20 }}>
          <Btn onClick={onBack} variant="secondary">Retour à la connexion</Btn>
        </div>
      </div>
    </div>
  );
}
