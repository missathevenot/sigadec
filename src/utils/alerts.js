export function buildDailyAlerts(diligences, user) {
  const alerts = [];
  const today = new Date();
  today.setHours(0,0,0,0);

  diligences.forEach(d => {
    if (d.statut === 'supprimee' || d.statut === 'executee') return;
    const ech = new Date(d.echeance + 'T00:00:00');
    const diff = Math.ceil((ech - today) / 86400000);

    if (diff < 0) {
      alerts.push({
        id: `alert-overdue-${d.id}`,
        type: 'overdue',
        message: `Diligence en retard : ${d.intitule}`,
        ref: d.reference,
        dilId: d.id,
        lu: false,
        date: new Date().toISOString(),
      });
    } else if (diff <= 3) {
      alerts.push({
        id: `alert-soon-${d.id}`,
        type: 'soon',
        message: `Échéance dans ${diff}j : ${d.intitule}`,
        ref: d.reference,
        dilId: d.id,
        lu: false,
        date: new Date().toISOString(),
      });
    }
  });

  return alerts;
}
