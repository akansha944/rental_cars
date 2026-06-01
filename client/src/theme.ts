import { createTheme, alpha, Theme } from '@mui/material/styles';
import { PaletteMode } from '@mui/material';

// ── Brand constants ──────────────────────────────────────────────
const INDIGO = '#4F46E5';
const INDIGO_DARK = '#4338CA';
const CYAN = '#06B6D4';

// A reusable brand gradient used on hero panels, logos, accents.
export const BRAND_GRADIENT = `linear-gradient(135deg, ${INDIGO} 0%, #6D28D9 55%, ${CYAN} 130%)`;

export function getTheme(mode: PaletteMode): Theme {
  const isDark = mode === 'dark';

  const textPrimary = isDark ? '#E5E9F2' : '#0F172A';
  const textSecondary = isDark ? '#94A3B8' : '#64748B';
  const bgDefault = isDark ? '#0B1120' : '#F6F7FB';
  const bgPaper = isDark ? '#131C31' : '#FFFFFF';
  const border = isDark ? '#243049' : '#E2E8F0';
  const headBg = isDark ? '#172339' : '#FBFCFE';

  return createTheme({
    palette: {
      mode,
      primary: { main: INDIGO, dark: INDIGO_DARK, light: '#818CF8', contrastText: '#fff' },
      secondary: { main: CYAN, contrastText: '#fff' },
      success: { main: '#16A34A' },
      warning: { main: '#F59E0B' },
      error: { main: '#DC2626' },
      info: { main: '#0EA5E9' },
      background: { default: bgDefault, paper: bgPaper },
      text: { primary: textPrimary, secondary: textSecondary },
      divider: border,
    },
    shape: { borderRadius: 14 },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif', fontWeight: 800, letterSpacing: '-0.02em' },
      h2: { fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif', fontWeight: 800, letterSpacing: '-0.02em' },
      h3: { fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif', fontWeight: 800, letterSpacing: '-0.02em' },
      h4: { fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif', fontWeight: 800, letterSpacing: '-0.02em' },
      h5: { fontWeight: 700, letterSpacing: '-0.01em' },
      h6: { fontWeight: 700, letterSpacing: '-0.01em' },
      subtitle1: { fontWeight: 600 },
      subtitle2: { fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 600, letterSpacing: 0 },
      caption: { letterSpacing: 0 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: bgDefault,
            backgroundImage: `radial-gradient(1200px 600px at 100% -10%, ${alpha(
              INDIGO,
              isDark ? 0.12 : 0.06
            )}, transparent), radial-gradient(900px 500px at -10% 10%, ${alpha(
              CYAN,
              isDark ? 0.1 : 0.05
            )}, transparent)`,
            backgroundAttachment: 'fixed',
          },
          '*::-webkit-scrollbar': { width: 10, height: 10 },
          '*::-webkit-scrollbar-thumb': {
            backgroundColor: alpha(textSecondary, 0.35),
            borderRadius: 8,
            border: '2px solid transparent',
            backgroundClip: 'content-box',
          },
          '*::-webkit-scrollbar-thumb:hover': { backgroundColor: alpha(textSecondary, 0.55) },
        },
      },
      MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            border: `1px solid ${border}`,
            borderRadius: 18,
            boxShadow: isDark
              ? '0 1px 2px rgba(0,0,0,0.4), 0 12px 28px -16px rgba(0,0,0,0.7)'
              : '0 1px 2px rgba(16,24,40,0.04), 0 8px 24px -12px rgba(16,24,40,0.12)',
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 12, padding: '8px 18px', fontSize: '0.9rem' },
          sizeLarge: { padding: '11px 22px', fontSize: '1rem' },
          containedPrimary: {
            background: BRAND_GRADIENT,
            backgroundSize: '150% 150%',
            transition: 'transform .15s ease, box-shadow .2s ease, background-position .4s ease',
            boxShadow: `0 8px 20px -8px ${alpha(INDIGO, 0.6)}`,
            '&:hover': {
              backgroundPosition: 'right center',
              transform: 'translateY(-1px)',
              boxShadow: `0 12px 26px -8px ${alpha(INDIGO, 0.7)}`,
            },
          },
          outlined: {
            borderColor: border,
            '&:hover': { borderColor: INDIGO, backgroundColor: alpha(INDIGO, 0.08) },
          },
        },
      },
      MuiDrawer: {
        styleOverrides: { paper: { backgroundColor: bgPaper, borderRight: `1px solid ${border}` } },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            '&.Mui-selected': {
              backgroundColor: alpha(INDIGO, isDark ? 0.22 : 0.1),
              color: isDark ? '#C7D2FE' : INDIGO,
              '& .MuiListItemIcon-root': { color: isDark ? '#C7D2FE' : INDIGO },
              '&:hover': { backgroundColor: alpha(INDIGO, isDark ? 0.28 : 0.14) },
            },
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-root': {
              backgroundColor: headBg,
              color: textSecondary,
              fontWeight: 700,
              fontSize: '0.72rem',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              borderBottom: `1px solid ${border}`,
            },
          },
        },
      },
      MuiTableCell: { styleOverrides: { root: { borderColor: alpha(border, 0.7) } } },
      MuiTableRow: {
        styleOverrides: { root: { '&:hover': { backgroundColor: alpha(INDIGO, isDark ? 0.08 : 0.03) } } },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 600, borderRadius: 8 },
          sizeSmall: { height: 22 },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            '& fieldset': { borderColor: border },
            '&:hover fieldset': { borderColor: alpha(INDIGO, 0.5) },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: isDark ? '#1E293B' : '#0F172A',
            fontSize: '0.75rem',
            borderRadius: 8,
            padding: '6px 10px',
          },
        },
      },
      MuiAvatar: { styleOverrides: { root: { fontWeight: 700 } } },
    },
  });
}
