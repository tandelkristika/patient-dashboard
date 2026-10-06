// Matches Tailwind's default breakpoints.
export const BREAKPOINTS = {
  md: 768,
  lg: 1024,
  xl: 1280,
};

// Mobile-first: invalid values fall back to mobile.
export const getDeviceClass = (width) => {
  if (!Number.isFinite(width)) return 'mobile';
  if (width >= BREAKPOINTS.xl) return 'desktop';
  if (width >= BREAKPOINTS.lg) return 'laptop';
  if (width >= BREAKPOINTS.md) return 'tablet';
  return 'mobile';
};

// Below 1024px the sidebar becomes a drawer.
export const usesDrawer = (width) =>
  !Number.isFinite(width) || width < BREAKPOINTS.lg;

// Below 768px tables become cards.
export const getTableMode = (width) =>
  !Number.isFinite(width) || width < BREAKPOINTS.md
    ? 'cards'
    : 'table';

export const initialDrawerState = {
  open: false,
};

export const drawerReducer = (state, action) => {
  switch (action.type) {
    case 'OPEN':
      return state.open ? state : { open: true };

    case 'TOGGLE':
      return { open: !state.open };

    case 'CLOSE':
    case 'ESCAPE':
    case 'ROUTE_CHANGE':
      return state.open ? { open: false } : state;

    case 'RESIZE':
      return state.open && !usesDrawer(action.width)
        ? { open: false }
        : state;

    default:
      return state;
  }
};
