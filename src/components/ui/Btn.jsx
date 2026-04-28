import { C } from '../../constants/colors';

const VARIANTS = {
  primary:   { bg: C.vert,    c: C.blanc,  border: C.vert    },
  secondary: { bg: C.blanc,   c: C.vert,   border: C.bord    },
  danger:    { bg: C.urg,     c: C.blanc,  border: C.urg     },
  ghost:     { bg: 'transparent', c: C.sec, border: 'transparent' },
  violet:    { bg: C.violet,  c: C.blanc,  border: C.violet  },
  teal:      { bg: C.teal,    c: C.blanc,  border: C.teal    },
  orange:    { bg: C.orng,    c: C.blanc,  border: C.orng    },
};

const SIZES = {
  sm: { fontSize: 12, padding: '6px 14px' },
  md: { fontSize: 14, padding: '9px 18px' },
  lg: { fontSize: 15, padding: '12px 22px' },
};

export default function Btn({ onClick, children, variant = 'primary', size = 'md', disabled = false, full = false, style = {} }) {
  const v = VARIANTS[variant] || VARIANTS.primary;
  const s = SIZES[size] || SIZES.md;
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{
        background: disabled ? '#E0E4EA' : v.bg,
        color: disabled ? '#9B9B9B' : v.c,
        border: `1.5px solid ${disabled ? '#E0E4EA' : v.border}`,
        borderRadius: 10,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        width: full ? '100%' : undefined,
        fontFamily: 'Inter, sans-serif',
        transition: 'opacity .15s',
        outline: 'none',
        ...s,
        ...style,
      }}
    >
      {children}
    </button>
  );
}
