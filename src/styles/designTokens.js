// Design tokens: colors, spacing, radii, shadows
export const COLORS = {
  PRIMARY: '#1976D2',
  PRIMARY_LIGHT: '#2196F3',
  BACKGROUND: '#F8F9FA',
  SURFACE: '#FFFFFF',
  TEXT: '#212121',
  MUTED: '#666666',
  DANGER: '#f44336',
  ACCENT: '#1E90FF'
};

export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 14,
  LG: 20,
  XL: 32
};

export const RADIUS = {
  SM: 6,
  MD: 10,
  LG: 14
};

export const SHADOW = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2
  }
};

export default { COLORS, SPACING, RADIUS, SHADOW };
