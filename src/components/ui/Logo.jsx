export default function Logo({ size = 48 }) {
  const w = size * 1.25;
  const h = size;
  return (
    <svg width={w} height={h} viewBox="0 0 60 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="60" height="48" rx="8" fill="#4CB87E"/>
      <text x="6" y="36" fontFamily="Nunito,sans-serif" fontWeight="900" fontSize="28" fill="#D45A00">D</text>
      <text x="22" y="36" fontFamily="Nunito,sans-serif" fontWeight="900" fontSize="28" fill="#FFFFFF">G</text>
      <text x="42" y="36" fontFamily="Nunito,sans-serif" fontWeight="900" fontSize="28" fill="#1B7A3E">I</text>
    </svg>
  );
}
