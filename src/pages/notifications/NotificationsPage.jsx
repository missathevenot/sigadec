import { C } from '../../constants/colors';
import { fmtRel } from '../../utils/dates';
import EmptyState from '../../components/ui/EmptyState';

export default function NotificationsPage({ notifications, setNotifications }) {
  const quotidiens = notifications.filter(n => n.type === 'overdue' || n.type === 'soon');
  const autres     = notifications.filter(n => n.type !== 'overdue' && n.type !== 'soon');

  const markRead = (id) => {
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, lu: true } : n));
  };

  const markAll = () => {
    setNotifications(ns => ns.map(n => ({ ...n, lu: true })));
  };

  const unread = notifications.filter(n => !n.lu).length;

  return (
    <div style={{ padding: '14px 14px 0', animation: 'pageIn .22s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 16, color: C.txt }}>
          {unread > 0 ? `${unread} non lue${unread > 1 ? 's' : ''}` : 'Tout à jour'}
        </div>
        {unread > 0 && (
          <button onClick={markAll} style={{ fontSize: 12, color: C.vert, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
            Tout marquer lu
          </button>
        )}
      </div>

      {quotidiens.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.sec, marginBottom: 8, textTransform: 'uppercase' }}>Rappels quotidiens</div>
          {quotidiens.map(n => <NotifCard key={n.id} n={n} onRead={markRead} />)}
        </div>
      )}

      {autres.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.sec, marginBottom: 8, textTransform: 'uppercase' }}>Autres</div>
          {autres.map(n => <NotifCard key={n.id} n={n} onRead={markRead} />)}
        </div>
      )}

      {notifications.length === 0 && (
        <EmptyState icon="🔔" title="Aucune notification" sub="Vous êtes à jour !" />
      )}
    </div>
  );
}

function NotifCard({ n, onRead }) {
  const isOver = n.type === 'overdue';
  return (
    <div
      onClick={() => onRead(n.id)}
      style={{
        background: n.lu ? C.bg : (isOver ? C.urgB : C.orngL),
        borderRadius: 12, padding: '12px 14px', marginBottom: 8,
        borderLeft: n.lu ? 'none' : `3px solid ${isOver ? C.urg : C.orng}`,
        cursor: 'pointer', opacity: n.lu ? 0.7 : 1,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: n.lu ? 400 : 700, color: n.lu ? C.sec : C.txt, lineHeight: 1.4 }}>{n.message}</div>
      {n.ref && <div style={{ fontSize: 10, color: C.sec, marginTop: 4, fontFamily: 'monospace' }}>{n.ref}</div>}
      <div style={{ fontSize: 10, color: C.sec, marginTop: 4 }}>{fmtRel(n.date)}</div>
    </div>
  );
}
