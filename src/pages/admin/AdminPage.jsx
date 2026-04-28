import { C } from '../../constants/colors';
import { ROLES_LABELS } from '../../constants/roles';
import { SERVICES } from '../../constants/services';
import { useStore } from '../../store';
import { supabase } from '../../lib/supabase';
import Av from '../../components/ui/Av';
import Btn from '../../components/ui/Btn';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import { useState } from 'react';

export default function AdminPage() {
  const { users, setUsers } = useStore();
  const [onglet, setOnglet] = useState('attente');

  const enAttente = users.filter(u => u.statut === 'en_attente');
  const actifs    = users.filter(u => u.statut === 'actif');

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

  return (
    <div style={{ padding: '14px 14px 0', animation: 'pageIn .22s ease-out' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {[{ v:'attente', l:`En attente (${enAttente.length})` }, { v:'actifs', l:`Actifs (${actifs.length})` }].map(t => (
          <button key={t.v} onClick={() => setOnglet(t.v)} style={{
            flex: 1, padding: '9px 0', borderRadius: 10, fontWeight: 700, fontSize: 13,
            border: `2px solid ${onglet === t.v ? C.vert : C.bord}`,
            background: onglet === t.v ? C.vertL : C.blanc,
            color: onglet === t.v ? C.vert : C.sec, cursor: 'pointer',
          }}>
            {t.l}
          </button>
        ))}
      </div>

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
    </div>
  );
}
