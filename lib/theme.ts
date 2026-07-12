export const theme = {
  bg: "#F4F2EC",
  panel: "#FDFCF9",
  panelBorder: "#E7E3D8",
  tile: "#EFEBE1",
  tilePressed: "#E7E2D5",

  text: "#2E2C27",
  textDim: "#6C685F",
  textFaint: "#A29D8F",

  accent: "#5C7A85",
  accentStrong: "#476069",
  accentSoft: "#E1EAEC",

  good: "#7E9C7E",
  goodSoft: "#E7EEE3",

  warn: "#C9975B",
  warnSoft: "#F3E7D6",

  radius: 20,
  radiusSm: 12,

  energy: {
    low: { fg: "#5F8272", bg: "#E4EEE7" },
    medium: { fg: "#B98A47", bg: "#F2E7D3" },
    high: { fg: "#B06A50", bg: "#F2E1D7" },
  },

  card: {
    shadowColor: "#3A362C",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 1,
  },
  cardStrong: {
    shadowColor: "#3A362C",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 3,
  },
};

export const energyLabel: Record<"low" | "medium" | "high", string> = {
  low: "Low energy",
  medium: "Medium energy",
  high: "High energy",
};
