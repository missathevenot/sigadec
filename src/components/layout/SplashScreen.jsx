import { useEffect, useState } from 'react';
import { C } from '../../constants/colors';
import Logo from '../ui/Logo';

export default function SplashScreen({ onDone }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const step = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(step); setTimeout(onDone, 200); return 100; }
        return p + 5;
      });
    }, 50);
    return () => clearInterval(step);
  }, [onDone]);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: C.vert,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, maxWidth: 430, margin: '0 auto',
    }}>
      <Logo size={72} />
      <div style={{ marginTop: 24, color: C.blanc, fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: 28, letterSpacing: 1 }}>
        SIGADEC
      </div>
      <div style={{ color: 'rgba(255,255,255,.75)', fontSize: 12, marginTop: 6, textAlign: 'center', paddingInline: 30 }}>
        Système Intégré de Gestion Administrative et Décisionnelle du Cadastre
      </div>
      <div style={{ marginTop: 40, width: 200, background: 'rgba(255,255,255,.3)', borderRadius: 6, height: 6, overflow: 'hidden' }}>
        <div style={{
          height: '100%', background: C.blanc, borderRadius: 6,
          width: `${progress}%`, transition: 'width .05s linear',
        }} />
      </div>
      <div style={{ color: 'rgba(255,255,255,.6)', fontSize: 11, marginTop: 8 }}>DGI — Direction du Cadastre CI</div>
    </div>
  );
}
