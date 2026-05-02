import { useState, useRef } from 'react';
import bcrypt from 'bcryptjs';
import { C } from '../../constants/colors';
import { ROLES_LABELS, ROLES_SANS_SERVICE } from '../../constants/roles';
import { SERVICES } from '../../constants/services';
import { useStore } from '../../store';
import { buildDailyAlerts } from '../../utils/alerts';
import { supabase } from '../../lib/supabase';
import { mapUser, userToDb } from '../../lib/mappers';
import { compressImage } from '../../utils/imageUtils';
import Logo from '../../components/ui/Logo';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Btn from '../../components/ui/Btn';

export default function AuthFlow() {
  const [view, setView] = useState('login');
  const { setUser, setNotifications, diligences, setUsers, users } = useStore();

  return (
    <div style={{
      minHeight: '100vh', background: C.bg,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 20, maxWidth: 430, margin: '0 auto',
    }}>
      {view === 'login'    && <LoginView onRegister={() => setView('register')} setUser={setUser} setNotifications={setNotifications} diligences={diligences} />}
      {view === 'register' && <RegisterView onBack={() => setView('login')} onDone={() => setView('confirm')} setUsers={setUsers} />}
      {view === 'confirm'  && <ConfirmView onBack={() => setView('login')} />}
    </div>
  );
}

/* ─────────────────────────────────────────────
   LOGIN — flux multi-étapes
   email → password → (migrate | create_password)
───────────────────────────────────────────── */
function LoginView({ onRegister, setUser, setNotifications, diligences }) {
  // Étapes : 'email' | 'password' | 'create_password' | 'migrate'
  const [step, setStep]         = useState('email');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [newPwd, setNewPwd]     = useState('');
  const [confirmPwd, setCPwd]   = useState('');
  const [profil, setProfil]     = useState(null); // enregistrement brut DB
  const [err, setErr]           = useState('');
  const [loading, setLoading]   = useState(false);

  // ── Étape 1 : vérification de l'email ──────────────────────────
  const checkEmail = async () => {
    if (!email.trim()) { setErr('Email requis.'); return; }
    setLoading(true); setErr('');
    try {
      const { data, error } = await supabase
        .from('utilisateurs')
        .select('id, prenom, nom, email, role, service_id, statut, mot_de_passe, photo_url, auth_migrated')
        .ilike('email', email.trim())
        .single();

      if (error || !data) { setErr('Adresse email inconnue.'); return; }
      if (data.statut !== 'actif') { setErr('Ce compte est en attente de validation.'); return; }

      setProfil(data);
      setStep('password');
    } catch { setErr('Erreur de connexion. Réessayez.'); }
    finally { setLoading(false); }
  };

  // ── Étape 2 : connexion Supabase Auth ─────────────────────────
  const trySignIn = async () => {
    if (!password.trim()) { setErr('Mot de passe requis.'); return; }
    setLoading(true); setErr('');
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: profil.email.toLowerCase(),
        password,
      });

      if (!error) { await completeLogin(profil); return; }

      const isInvalidCredentials =
        error.code === 'invalid_login_credentials' ||
        error.message?.toLowerCase().includes('invalid login credentials');

      if (isInvalidCredentials) {
        if (profil.mot_de_passe) {
          // Compte avec ancien hash bcrypt → migration
          setStep('migrate');
        } else if (!profil.auth_migrated) {
          // Compte sans mot de passe, jamais migré → création du 1er mot de passe
          setStep('create_password');
        } else {
          setErr('Mot de passe incorrect.');
        }
        return;
      }

      if (error.code === 'email_not_confirmed') {
        setErr('Email non confirmé. Contactez votre administrateur.');
        return;
      }

      setErr('Erreur : ' + error.message);
    } catch { setErr('Erreur de connexion.'); }
    finally { setLoading(false); }
  };

  // ── Étape 3a : créer un premier mot de passe (compte sans mdp) ─
  const createPassword = async () => {
    if (newPwd.length < 8) { setErr('Minimum 8 caractères.'); return; }
    if (newPwd !== confirmPwd) { setErr('Les mots de passe ne correspondent pas.'); return; }
    setLoading(true); setErr('');
    try {
      const { error: signUpErr } = await supabase.auth.signUp({
        email: profil.email.toLowerCase(),
        password: newPwd,
      });
      if (signUpErr && !signUpErr.message?.toLowerCase().includes('already registered')) {
        setErr('Erreur lors de la création : ' + signUpErr.message); return;
      }

      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: profil.email.toLowerCase(), password: newPwd,
      });
      if (signInErr) { setErr('Erreur de connexion après création.'); return; }

      // Marquer le compte comme migré
      await supabase.from('utilisateurs')
        .update({ auth_migrated: true })
        .eq('id', profil.id);

      await completeLogin(profil);
    } catch { setErr('Erreur lors de la création du mot de passe.'); }
    finally { setLoading(false); }
  };

  // ── Étape 3b : migrer de bcrypt vers Supabase Auth ────────────
  const migrateAccount = async () => {
    if (!password.trim()) { setErr('Ancien mot de passe requis.'); return; }
    if (newPwd.length < 8) { setErr('Nouveau mot de passe : minimum 8 caractères.'); return; }
    if (newPwd !== confirmPwd) { setErr('Les mots de passe ne correspondent pas.'); return; }
    setLoading(true); setErr('');
    try {
      // Vérifier l'ancien hash bcrypt
      const ok = await bcrypt.compare(password, profil.mot_de_passe);
      if (!ok) { setErr('Ancien mot de passe incorrect.'); return; }

      // Créer le compte Supabase Auth avec le nouveau mot de passe
      const { error: signUpErr } = await supabase.auth.signUp({
        email: profil.email.toLowerCase(),
        password: newPwd,
      });
      if (signUpErr && !signUpErr.message?.toLowerCase().includes('already registered')) {
        setErr('Erreur lors de la migration : ' + signUpErr.message); return;
      }

      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: profil.email.toLowerCase(), password: newPwd,
      });
      if (signInErr) { setErr('Erreur de connexion après migration.'); return; }

      // Effacer l'ancien hash + marquer comme migré
      await supabase.from('utilisateurs')
        .update({ mot_de_passe: null, auth_migrated: true })
        .eq('id', profil.id);

      await completeLogin(profil);
    } catch { setErr('Erreur lors de la migration.'); }
    finally { setLoading(false); }
  };

  const completeLogin = async (p) => {
    const u = mapUser(p);
    const alerts = buildDailyAlerts(diligences, u);
    setNotifications(alerts);
    setUser(u);
  };

  const reset = () => { setStep('email'); setEmail(''); setPassword(''); setNewPwd(''); setCPwd(''); setProfil(null); setErr(''); };

  /* ── Rendu ── */
  return (
    <div style={{ width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Logo size={56} />
        <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: 26, color: C.vert, marginTop: 12 }}>SIGADEC</div>
        <div style={{ fontSize: 12, color: C.sec, marginTop: 4 }}>Direction du Cadastre — DGI CI</div>
      </div>

      <div style={{ background: C.blanc, borderRadius: 14, padding: '24px 20px', boxShadow: '0 1px 6px rgba(0,0,0,.07)' }}>

        {/* ── Étape : email ── */}
        {step === 'email' && (
          <>
            <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 18, color: C.txt, marginBottom: 18 }}>Connexion</div>
            <Input label="Adresse email" value={email} onChange={v => { setEmail(v); setErr(''); }} type="email" placeholder="votre.email@..." required />
            {err && <Err msg={err} />}
            <Btn onClick={checkEmail} full disabled={loading}>{loading ? 'Vérification…' : 'Continuer →'}</Btn>
            <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: C.sec }}>
              Pas encore de compte ?{' '}
              <span onClick={onRegister} style={{ color: C.vert, fontWeight: 700, cursor: 'pointer' }}>S'inscrire</span>
            </div>
          </>
        )}

        {/* ── Étape : password (Supabase Auth) ── */}
        {step === 'password' && (
          <>
            <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 18, color: C.txt, marginBottom: 4 }}>Bonjour, {profil?.prenom} !</div>
            <div style={{ fontSize: 12, color: C.sec, marginBottom: 18 }}>{profil?.email}</div>
            <Input label="Mot de passe" value={password} onChange={v => { setPassword(v); setErr(''); }} type="password" placeholder="••••••••" required />
            {err && <Err msg={err} />}
            <Btn onClick={trySignIn} full disabled={loading}>{loading ? 'Connexion…' : 'Se connecter'}</Btn>
            <Back onClick={reset} />
          </>
        )}

        {/* ── Étape : create_password (1ère connexion sécurisée) ── */}
        {step === 'create_password' && (
          <>
            <div style={{ fontSize: 22, textAlign: 'center', marginBottom: 8 }}>🔐</div>
            <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 16, color: C.txt, marginBottom: 6, textAlign: 'center' }}>Sécurisez votre compte</div>
            <div style={{ fontSize: 12, color: C.sec, marginBottom: 18, textAlign: 'center', lineHeight: 1.5 }}>
              Première connexion sécurisée — créez votre mot de passe personnel.
            </div>
            <Input label="Nouveau mot de passe" value={newPwd} onChange={v => { setNewPwd(v); setErr(''); }} type="password" placeholder="Min. 8 caractères" required />
            <Input label="Confirmer le mot de passe" value={confirmPwd} onChange={v => { setCPwd(v); setErr(''); }} type="password" placeholder="••••••••" required />
            {err && <Err msg={err} />}
            <Btn onClick={createPassword} full disabled={loading}>{loading ? 'Création…' : 'Créer le mot de passe'}</Btn>
            <Back onClick={() => setStep('password')} />
          </>
        )}

        {/* ── Étape : migrate (ancien hash bcrypt → Supabase Auth) ── */}
        {step === 'migrate' && (
          <>
            <div style={{ fontSize: 22, textAlign: 'center', marginBottom: 8 }}>🔄</div>
            <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 16, color: C.txt, marginBottom: 6, textAlign: 'center' }}>Migration de sécurité</div>
            <div style={{ fontSize: 12, color: C.sec, marginBottom: 18, textAlign: 'center', lineHeight: 1.5 }}>
              Votre compte passe à un système d'authentification renforcé.<br />
              Entrez votre ancien mot de passe, puis créez-en un nouveau.
            </div>
            <Input label="Ancien mot de passe" value={password} onChange={v => { setPassword(v); setErr(''); }} type="password" placeholder="••••••••" required />
            <Input label="Nouveau mot de passe" value={newPwd} onChange={v => { setNewPwd(v); setErr(''); }} type="password" placeholder="Min. 8 caractères" required />
            <Input label="Confirmer le nouveau" value={confirmPwd} onChange={v => { setCPwd(v); setErr(''); }} type="password" placeholder="••••••••" required />
            {err && <Err msg={err} />}
            <Btn onClick={migrateAccount} full disabled={loading}>{loading ? 'Migration…' : 'Sécuriser mon compte'}</Btn>
            <Back onClick={reset} />
          </>
        )}

      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   INSCRIPTION
───────────────────────────────────────────── */
function RegisterView({ onBack, onDone, setUsers }) {
  const [prenom, setPrenom]           = useState('');
  const [nom, setNom]                 = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirmPwd, setCPwd]         = useState('');
  const [role, setRole]               = useState('');
  const [serviceId, setSvc]           = useState('');
  const [photoBlob, setPhotoBlob]     = useState(null);
  const [photoPreview, setPhotoP]     = useState(null);
  const [err, setErr]                 = useState('');
  const [loading, setLoading]         = useState(false);
  const fileRef                       = useRef(null);

  // Admin et Directeur ne peuvent pas s'auto-inscrire
  const roleOptions = Object.entries(ROLES_LABELS)
    .filter(([v]) => !['admin', 'directeur'].includes(v))
    .map(([v, l]) => ({ value: v, label: l }));
  const serviceOptions = SERVICES.map(s => ({ value: s.id, label: `${s.abbr} — ${s.nom.substring(0, 35)}…` }));
  const needService    = role && !ROLES_SANS_SERVICE.includes(role);

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setErr('Fichier image requis.'); return; }
    const blob = await compressImage(file);
    setPhotoBlob(blob);
    setPhotoP(URL.createObjectURL(blob));
    setErr('');
  };

  const submit = async () => {
    if (!prenom.trim() || !nom.trim() || !email.trim() || !role || !password) {
      setErr('Tous les champs obligatoires sont requis.'); return;
    }
    if (needService && !serviceId) { setErr('Veuillez sélectionner un service.'); return; }
    if (password.length < 8) { setErr('Le mot de passe doit contenir au moins 8 caractères.'); return; }
    if (password !== confirmPwd) { setErr('Les mots de passe ne correspondent pas.'); return; }

    setLoading(true); setErr('');
    try {
      // 1. Créer le compte Supabase Auth
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      });
      if (authErr && !authErr.message?.toLowerCase().includes('already registered')) {
        setErr('Cet email est déjà utilisé ou une erreur est survenue.'); return;
      }

      // 2. ID = UUID Supabase Auth (ou UUID aléatoire en fallback)
      const userId = authData?.user?.id || crypto.randomUUID();

      // 3. Upload photo si fournie (pendant que la session est active)
      let photoUrl = null;
      if (photoBlob) {
        const path = `${userId}.jpg`;
        const { error: upErr } = await supabase.storage
          .from('avatars')
          .upload(path, photoBlob, { upsert: true, contentType: 'image/jpeg' });
        if (!upErr) {
          const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
          photoUrl = publicUrl;
        }
      }

      // 4. Créer le profil dans utilisateurs (statut en_attente, auth_migrated: true)
      const newUser = {
        id: userId, prenom: prenom.trim(), nom: nom.trim(),
        email: email.trim().toLowerCase(), role,
        serviceId: needService ? serviceId : null,
        statut: 'en_attente', photoUrl,
        authMigrated: true,
      };
      const { error: dbErr } = await supabase.from('utilisateurs').insert(userToDb(newUser));
      if (dbErr) { setErr('Erreur lors de la création du profil.'); return; }

      // 5. Déconnecter (compte en attente de validation admin)
      await supabase.auth.signOut();

      setUsers(us => [...us, newUser]);
      onDone();
    } catch { setErr('Erreur lors de la soumission.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ background: C.blanc, borderRadius: 14, padding: '24px 20px', boxShadow: '0 1px 6px rgba(0,0,0,.07)' }}>
        <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 18, color: C.txt, marginBottom: 18 }}>Demande d'inscription</div>

        {/* Photo optionnelle */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 16 }}>
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              width: 72, height: 72, borderRadius: '50%', overflow: 'hidden',
              background: C.vertL, border: `2px dashed ${C.vert}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            {photoPreview
              ? <img src={photoPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="preview" />
              : <span style={{ fontSize: 28 }}>📷</span>
            }
          </div>
          <span style={{ fontSize: 11, color: C.sec, marginTop: 6 }}>Photo de profil (optionnelle)</span>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
        </div>

        <Input label="Prénom" value={prenom} onChange={setPrenom} required />
        <Input label="Nom" value={nom} onChange={setNom} required />
        <Input label="Email" value={email} onChange={setEmail} type="email" required />
        <Input label="Mot de passe" value={password} onChange={v => { setPassword(v); setErr(''); }} type="password" placeholder="Min. 8 caractères" required />
        <Input label="Confirmer le mot de passe" value={confirmPwd} onChange={v => { setCPwd(v); setErr(''); }} type="password" placeholder="••••••••" required />
        <Select label="Rôle" value={role} onChange={setRole} options={roleOptions} required placeholder="Sélectionner un rôle…" />
        {needService && <Select label="Service" value={serviceId} onChange={setSvc} options={serviceOptions} required placeholder="Sélectionner un service…" />}

        {err && <Err msg={err} />}
        <Btn onClick={submit} full disabled={loading}>{loading ? 'Envoi…' : 'Soumettre la demande'}</Btn>
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <span onClick={onBack} style={{ color: C.sec, fontSize: 13, cursor: 'pointer' }}>← Retour</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   CONFIRMATION
───────────────────────────────────────────── */
function ConfirmView({ onBack }) {
  return (
    <div style={{ width: '100%', textAlign: 'center' }}>
      <div style={{ background: C.blanc, borderRadius: 14, padding: '32px 20px', boxShadow: '0 1px 6px rgba(0,0,0,.07)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
        <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 18, color: C.txt, marginBottom: 10 }}>Demande envoyée</div>
        <div style={{ fontSize: 14, color: C.sec, lineHeight: 1.6 }}>
          Votre demande a été soumise. L'administrateur validera votre compte dans les meilleurs délais.
        </div>
        <div style={{ marginTop: 20 }}>
          <Btn onClick={onBack} variant="secondary">Retour à la connexion</Btn>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Composants locaux
───────────────────────────────────────────── */
function Err({ msg }) {
  return <div style={{ color: C.urg, fontSize: 12, marginBottom: 10, padding: '6px 10px', background: '#FEF2F2', borderRadius: 6 }}>{msg}</div>;
}

function Back({ onClick }) {
  return (
    <div style={{ textAlign: 'center', marginTop: 12 }}>
      <span onClick={onClick} style={{ color: C.sec, fontSize: 13, cursor: 'pointer' }}>← Retour</span>
    </div>
  );
}
