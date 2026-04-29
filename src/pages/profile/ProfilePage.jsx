import { useState, useRef } from 'react';
import { C } from '../../constants/colors';
import { ROLES_LABELS } from '../../constants/roles';
import { SERVICES } from '../../constants/services';
import { supabase } from '../../lib/supabase';
import { compressImage } from '../../utils/imageUtils';
import { useStore } from '../../store';
import Av from '../../components/ui/Av';
import Card from '../../components/ui/Card';

export default function ProfilePage({ user }) {
  const { setUser } = useStore();
  const svc = user.serviceId ? SERVICES.find(s => s.id === user.serviceId) : null;
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setErr('Fichier image requis.'); return; }

    setUploading(true);
    setErr('');
    try {
      const blob = await compressImage(file);
      const ext  = 'jpg';
      const path = `${user.id}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      const photoUrl = `${publicUrl}?t=${Date.now()}`;

      await supabase.from('utilisateurs').update({ photo_url: photoUrl }).eq('id', user.id);
      setUser({ ...user, photoUrl });
    } catch (e) {
      setErr('Erreur lors de l\'upload. Réessayez.');
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ animation: 'pageIn .22s ease-out' }}>
      <div style={{
        background: `linear-gradient(135deg, ${C.vertF} 0%, ${C.vertM} 100%)`,
        padding: '40px 20px 60px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
      }}>
        {/* Avatar cliquable */}
        <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => !uploading && fileRef.current?.click()}>
          <Av u={user} sz={80} />
          <div style={{
            position: 'absolute', bottom: 0, right: 0,
            background: C.vert, color: C.blanc,
            borderRadius: '50%', width: 26, height: 26,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, border: `2px solid ${C.blanc}`,
            boxShadow: '0 1px 4px rgba(0,0,0,.2)',
          }}>
            {uploading ? '…' : '📷'}
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handlePhotoChange}
        />

        <div style={{ textAlign: 'center' }}>
          <div style={{ color: C.blanc, fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: 20 }}>
            {user.prenom} {user.nom}
          </div>
          <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 13, marginTop: 4 }}>
            {ROLES_LABELS[user.role]}
          </div>
          {svc && (
            <div style={{ marginTop: 8, background: 'rgba(255,255,255,.2)', borderRadius: 12, padding: '4px 14px', display: 'inline-block', color: C.blanc, fontSize: 12 }}>
              {svc.abbr}
            </div>
          )}
          {uploading && (
            <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 12, marginTop: 8 }}>Chargement de la photo…</div>
          )}
          {err && (
            <div style={{ color: '#FECACA', fontSize: 12, marginTop: 8 }}>{err}</div>
          )}
        </div>
      </div>

      <div style={{ padding: '14px', marginTop: -20 }}>
        <Card>
          <Row label="Email" value={user.email} />
          <Row label="Fonction" value={ROLES_LABELS[user.role] || user.role} />
          <Row label="Statut" value={user.statut === 'actif' ? '✅ Actif' : '⏳ En attente'} />
          {svc && <Row label="Service" value={svc.nom} />}
        </Card>
        <div style={{ textAlign: 'center', marginTop: 10, fontSize: 11, color: C.sec }}>
          Appuyez sur la photo pour la modifier · JPEG compressé &lt; 1 Mo
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', paddingBlock: 10, borderBottom: `1px solid ${C.bord}` }}>
      <span style={{ fontSize: 11, color: C.sec, fontWeight: 600, marginBottom: 2 }}>{label}</span>
      <span style={{ fontSize: 14, color: C.txt }}>{value}</span>
    </div>
  );
}
