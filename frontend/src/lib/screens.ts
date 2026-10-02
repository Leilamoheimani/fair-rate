// Stable names for the prototype screens, used in stored data and CSV columns.
export const screenNames: Record<number, string> = {
  0: "start",
  2: "projekt",
  3: "schaetzung",
  4: "kosten",
  5: "untergrenze",
  6: "umfang",
  7: "angebote",
  8: "preis_anpassen",
  9: "angebot_details",
  11: "versenden",
  12: "fertig",
};

export const screenName = (screen: number) => screenNames[screen] ?? `screen_${screen}`;
