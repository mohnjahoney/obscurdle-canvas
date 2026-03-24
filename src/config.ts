// Centralized configuration (data only)

export const CONFIG = {
  canvas: {
    width: 600,
    height: 800,
  },

  grid: {
    rows: 6,
    cols: 5,
    tileSize: 60,
    gap: 8,
  },

  laser: {
    source: {
      y: 60,
    },

    width: {
      initial: 8,
      medium: 4,
      thin: 2,
    },

    timing: {
      fireDuration: 0.1,
      holdDuration: 0.3,
      fadeDuration: 0.1,
      intervalMs: 3000,
    },
  },
}
