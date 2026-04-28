import { C } from '../../constants/colors';

export default function Card({ children, style = {} }) {
  return (
    <div style={{
      background: C.blanc,
      borderRadius: 14,
      boxShadow: '0 1px 6px rgba(0,0,0,.07)',
      padding: '14px 16px',
      ...style,
    }}>
      {children}
    </div>
  );
}
