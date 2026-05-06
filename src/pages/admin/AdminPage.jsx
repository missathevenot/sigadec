import { C } from '../../constants/colors';
import { ROLES_LABELS } from '../../constants/roles';
import { SERVICES } from '../../constants/services';
import { useStore } from '../../store';
import { supabase } from '../../lib/supabase';
import Av from '../../components/ui/Av';
import Btn from '../../components/ui/Btn';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import { useState, useEffect } from 'react';

// Seuil : si last_seen_at > 12 min (2 battements manqués) → inactif
const STALE_MS = 12 * 60 * 1000;

function fmtDT(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const date = d.toLocaleDateString('fr-CI', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = d.toLocaleTimeString('fr-CI', { hour: '2-digit', minute: '2-digit' });
  return `${date} à ${time}`;
}

function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('fr-CI', { hour: '2-digit', minute: '2-digit' });
}

function timeSince(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const min  = Math.floor(diff / 60000);
  if (min < 1)  return 'à l\'instant';
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  return `il y a ${h}h${String(min % 60).padStart(2, '0')}`;
}

export default function AdminPage() {
  const { users, setUsers } = useStore();
  const [onglet, setOnglet]     = useState('attente');
  const [sessions, setSessions] = useState([]);
  const [now, setNow]           = useState(Date.now());

  const enAttente = users.filter(u => u.statut === 'en_attente');
  const actifs    = users.filter(u => u.statut === 'actif');

  // Mise à jour de "maintenant" toutes les 30 s (pour le calcul timeSince)
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Chargement initial + abonnement temps réel sur user_sessions
  useEffect(() => {
    if (onglet !== 'connectes') return;

    // Fetch initial
    supabase.from('user_sessions')
      .select('*')
      .order('last_seen_at', { ascending: false })
      .then(({ data }) => setSessions(data || []));

    // Abonnement Realtime
    const channel = supabase
      .channel('admin-user-sessions')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'user_sessions',
      }, (payload) => {
        setSessions(prev => {
          if (payload.eventType === 'INSERT') {
            return [payload.new, ...prev];
          }
          if (payload.eventType === 'UPDATE') {
            const exists = prev.some(s => s.user_id === payload.new.user_id);
            if (exists) return prev.map(s => s.user_id === payload.new.user_id ? payload.new : s);
            return [payload.new, ...prev];
          }
          if (payload.eventType === 'DELETE') {
            return prev.filter(s => s.user_id !== payload.old.user_id);
          }
          return prev;
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [onglet]);

  // Tri : en ligne d'abord, puis par last_seen_at décroissant
  const sessionsSorted = [...sessions].sort((a, b) => {
    if (a.is_online !== b.is_online) return a.is_online ? -1 : 1;
    return new Date(b.last_seen_at) - new Date(a.last_seen_at);
  });

  const online  = sessionsSorted.filter(s => s.is_online && (now - new Date(s.last_seen_at).getTime()) < STALE_MS);
  const stale   = sessionsSorted.filter(s => s.is_online && (now - new Date(s.last_seen_at).getTime()) >= STALE_MS);
  const offline = sessionsSorted.filter(s => !s.is_online);

  // ── Gestion des utilisateurs ──
  const valider = async (id) => {
    await supabase.from('utilisateurs').update({ statut: 'actif' }).eq('id', id);
    setUsers(us => us.map(u => u.id === id ? { ...u, statut: 'actif' } : u));
  };
  const rejeter = async (id) => {
    if (window.confirm('Rejeter et supprimer ce compte ?')) {
      await supabase.from('utilisateurs').delete().eq('id', id);
      setUsers(us => us.filter(u => u.id !== id));
    }
  };
  const suspendre = async (id) => {
    await supabase.from('utilisateurs').update({ statut: 'en_attente' }).eq('id', id);
    setUsers(us => us.map(u => u.id === id ? { ...u, statut: 'en_attente' } : u));
  };
  const supprimer = async (id) => {
    if (window.confirm('Supprimer définitivement ce compte ?')) {
      await supabase.from('utilisateurs').delete().eq('id', id);
      setUsers(us => us.filter(u => u.id !== id));
    }
  };

  const TABS = [
    { v: 'attente',   l: `En attente (${enAttente.length})` },
    { v: 'actifs',    l: `Actifs (${actifs.length})` },
    { v: 'connectes', l: `🟢 Connectés` },
  ];

  return (
    <div style={{ padding: '14px 14px 0', animation: 'pageIn .22s ease-out' }}>
      {/* Onglets */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.v} onClick={() => setOnglet(t.v)} style={{
            flex: 1, minWidth: 100, padding: '9px 6px', borderRadius: 10, fontWeight: 700, fontSize: 12,
            border: `2px solid ${onglet === t.v ? C.vert : C.bord}`,
            background: onglet === t.v ? C.vertL : C.blanc,
            color: onglet === t.v ? C.vert : C.sec, cursor: 'pointer',
          }}>
            {t.l}
          </button>
        ))}
      </div>

      {/* ── En attente ── */}
      {onglet === 'attente' && (
        enAttente.length === 0
          ? <EmptyState icon="✅" title="Aucun compte en attente" sub="Tous les comptes sont validés." />
          : enAttente.map(u => {
              const svc = u.serviceId ? SERVICES.find(s => s.id === u.serviceId) : null;
              return (
                <Card key={u.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                    <Av u={u} sz={40} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: C.txt }}>{u.prenom} {u.nom}</div>
                      <div style={{ fontSize: 12, color: C.sec }}>{u.email}</div>
                      <div style={{ fontSize: 11, color: C.sec }}>{ROLES_LABELS[u.role]}{svc ? ` — ${svc.abbr}` : ''}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Btn onClick={() => valider(u.id)} variant="primary" size="sm" full>✅ Valider</Btn>
                    <Btn onClick={() => rejeter(u.id)} variant="danger" size="sm" full>❌ Rejeter</Btn>
                  </div>
                </Card>
              );
            })
      )}

      {/* ── Actifs ── */}
      {onglet === 'actifs' && (
        actifs.map(u => {
          const svc = u.serviceId ? SERVICES.find(s => s.id === u.serviceId) : null;
          return (
            <Card key={u.id} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                <Av u={u} sz={40} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.txt }}>{u.prenom} {u.nom}</div>
                  <div style={{ fontSize: 12, color: C.sec }}>{u.email}</div>
                  <div style={{ fontSize: 11, color: C.sec }}>{ROLES_LABELS[u.role]}{svc ? ` — ${svc.abbr}` : ''}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn onClick={() => suspendre(u.id)} variant="secondary" size="sm" full>⏸ Suspendre</Btn>
                <Btn onClick={() => supprimer(u.id)} variant="danger" size="sm" full>🗑️ Supprimer</Btn>
              </div>
            </Card>
          );
        })
      )}

      {/* ── Connectés (temps réel) ── */}
      {onglet === 'connectes' && (
        <div>
          {/* Compteurs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
            <StatBox value={online.length}  label="En ligne"   color={C.vert}   bg={C.vertL}   dot="🟢" />
            <StatBox value={stale.length}   label="Inactif"    color={C.orng}   bg={C.orngL}   dot="🟡" />
            <StatBox value={offline.length} label="Déconnecté" color={C.sec}    bg="#F0F2F5"   dot="⚫" />
          </div>

          {sessions.length === 0 && (
            <EmptyState icon="👥" title="Aucune session enregistrée" sub="Les données apparaîtront dès la prochaine connexion d'un utilisateur." />
          )}

          {/* En ligne */}
          {online.length > 0 && (
            <SectionTitle label="🟢 En ligne" count={online.length} color={C.vert} />
          )}
          {online.map(s => (
            <SessionCard key={s.user_id} s={s} status="online" now={now} />
          ))}

          {/* Inactif (heartbeat perdu) */}
          {stale.length > 0 && (
            <SectionTitle label="🟡 Inactif (session ouverte, navigateur fermé ?)" count={stale.length} color={C.orng} />
          )}
          {stale.map(s => (
            <SessionCard key={s.user_id} s={s} status="stale" now={now} />
          ))}

          {/* Déconnectés */}
          {offline.length > 0 && (
            <SectionTitle label="⚫ Déconnectés" count={offline.length} color={C.sec} />
          )}
          {offline.map(s => (
            <SessionCard key={s.user_id} s={s} status="offline" now={now} />
          ))}

          <div style={{ fontSize: 10, color: C.sec, textAlign: 'center', marginTop: 12, marginBottom: 8, fontStyle: 'italic' }}>
            Mis à jour en temps réel · Heartbeat toutes les 5 min
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Composants internes ── */

function StatBox({ value, label, color, bg, dot }) {
  return (
    <div style={{ background: bg, borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 900, color, fontFamily: 'Nunito, sans-serif' }}>{value}</div>
      <div style={{ fontSize: 10, color, fontWeight: 600 }}>{dot} {label}</div>
    </div>
  );
}

function SectionTitle({ label, count, color }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, color,
      marginBottom: 6, marginTop: 10,
      display: 'flex', alignItems: 'center', gap: 6,
    }}>
      {label}
      <span style={{ background: color, color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 10 }}>
        {count}
      </span>
    </div>
  );
}

function SessionCard({ s, status, now }) {
  const dotColor  = status === 'online' ? C.vert : status === 'stale' ? C.orng : C.sec;
  const cardBg    = status === 'online' ? C.vertL : status === 'stale' ? C.orngL : '#F0F2F5';
  const svc       = s.service_id ? SERVICES.find(sv => sv.id === s.service_id) : null;
  const sinceStr  = timeSince(s.last_seen_at);

  return (
    <Card style={{
      marginBottom: 8,
      borderLeft: `4px solid ${dotColor}`,
      background: cardBg,
      padding: '10px 14px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        {/* Infos utilisateur */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
            <span style={{
              width: 9, height: 9, borderRadius: '50%', background: dotColor,
              display: 'inline-block', flexShrink: 0,
              boxShadow: status === 'online' ? `0 0 0 3px ${dotColor}30` : 'none',
            }} />
            <span style={{ fontWeight: 800, fontSize: 14, color: C.txt }}>
              {s.user_name || s.user_email}
            </span>
          </div>
          <div style={{ fontSize: 11, color: C.sec, marginBottom: 2 }}>{s.user_email}</div>
          {svc && (
            <div style={{ fontSize: 10, color: dotColor, fontWeight: 600 }}>{svc.abbr}</div>
          )}
        </div>

        {/* Statut temporel */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          {status === 'online' && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.vert }}>EN LIGNE</div>
              <div style={{ fontSize: 10, color: C.sec, marginTop: 2 }}>
                Connecté à {fmtTime(s.connected_at)}
              </div>
              <div style={{ fontSize: 10, color: C.sec }}>Vu {sinceStr}</div>
            </>
          )}
          {status === 'stale' && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.orng }}>INACTIF</div>
              <div style={{ fontSize: 10, color: C.sec, marginTop: 2 }}>
                Dernier signal {sinceStr}
              </div>
              <div style={{ fontSize: 10, color: C.sec }}>Connecté à {fmtTime(s.connected_at)}</div>
            </>
          )}
          {status === 'offline' && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.sec }}>DÉCONNECTÉ</div>
              <div style={{ fontSize: 10, color: C.sec, marginTop: 2 }}>
                {fmtDT(s.disconnected_at)}
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
