export default function Badge({ l, bg, c }) {
  return (
    <span style={{
      background: bg,
      color: c,
      borderRadius: 20,
      fontSize: 10,
      fontWeight: 700,
      padding: '3px 9px',
      display: 'inline-block',
      letterSpacing: 0.3,
      whiteSpace: 'nowrap',
    }}>
      {l}
    </span>
  );
}
