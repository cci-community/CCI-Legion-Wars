// Copyright (c) 2026 CCI Volunteer Legion and ATLNO.exe.
// Offline fallback only. Live brackets are derived from the published public workbook tabs at runtime.

const finalistSlots = Array.from({ length: 16 }, (_, index) => {
  const slot = index + 1;
  return {
    id: String(slot),
    name: `Finalist ${slot}`,
    summary: slot <= 12 ? "Awaiting direct group qualifier" : "Awaiting wildcard qualifier",
    status: "Awaiting result",
    qualifiers: [
      { seed: `F${slot}`, name: "Awaiting qualifier", placement: 1, pending: true },
      { seed: "-", name: slot <= 12 ? "Group qualification pending" : "Wildcard qualification pending", placement: 2, pending: true }
    ]
  };
});

const roundOf16 = Array.from({ length: 8 }, (_, index) => {
  const match = index + 1;
  return {
    id: `R16M${match}`,
    label: `Match ${match}`,
    status: "pending",
    bestOf: 3,
    feed: "Winner advances",
    starts: "National Finals",
    entrants: [
      { seed: `F${match}`, name: "Awaiting qualifier", score: null, pending: true },
      { seed: `F${17 - match}`, name: "Awaiting qualifier", score: null, pending: true }
    ]
  };
});

const quarterfinals = Array.from({ length: 4 }, (_, index) => {
  const match = index + 1;
  return {
    id: `QFM${match}`,
    label: `Quarterfinal ${match}`,
    status: "pending",
    bestOf: 3,
    feed: "Winner advances",
    starts: `After Match ${match * 2 - 1}/Match ${match * 2}`,
    entrants: [
      { seed: `W-R16-${match * 2 - 1}`, name: `Winner Match ${match * 2 - 1}`, score: null, pending: true },
      { seed: `W-R16-${match * 2}`, name: `Winner Match ${match * 2}`, score: null, pending: true }
    ]
  };
});

const semifinals = Array.from({ length: 2 }, (_, index) => {
  const match = index + 1;
  return {
    id: `SFM${match}`,
    label: `Semifinal ${match}`,
    status: "pending",
    bestOf: 3,
    feed: "Winner advances",
    starts: `After Quarterfinal ${match * 2 - 1}/Quarterfinal ${match * 2}`,
    entrants: [
      { seed: `W-QF-${match * 2 - 1}`, name: `Winner Quarterfinal ${match * 2 - 1}`, score: null, pending: true },
      { seed: `W-QF-${match * 2}`, name: `Winner Quarterfinal ${match * 2}`, score: null, pending: true }
    ]
  };
});

export const tournament = {
  id: "fallback-national-finals",
  label: "National Finals",
  type: "finals",
  status: [
    { label: "Data", value: "Fallback" },
    { label: "Public feeds", value: "5 tabs" },
    { label: "Finalists", value: "0/16" },
    { label: "Format", value: "Single elimination" }
  ],
  bracket: {
    phase: "National Finals",
    mode: "16-player single elimination",
    rounds: [
      {
        id: "round-of-16",
        title: "Round of 16",
        matches: roundOf16
      },
      {
        id: "quarterfinals",
        title: "Quarterfinals",
        matches: quarterfinals
      },
      {
        id: "semifinals",
        title: "Semifinals",
        matches: semifinals
      },
      {
        id: "grand-final",
        title: "Grand Final",
        matches: [
          {
            id: "GFM1",
            label: "Grand Final",
            status: "pending",
            bestOf: 5,
            feed: "Champion decided",
            starts: "After semifinals",
            entrants: [
              { seed: "W-SF-1", name: "Winner Semifinal 1", score: null, pending: true },
              { seed: "W-SF-2", name: "Winner Semifinal 2", score: null, pending: true }
            ]
          }
        ]
      }
    ]
  },
  lobbies: finalistSlots,
  rules: [
    {
      title: "Public Source",
      state: "locked",
      body: "The website reads only the five published public workbook tabs configured for Titan, Nexus, Dominion, Wildcard, and National Finals."
    },
    {
      title: "Advancement",
      state: "locked",
      body: "Titan, Nexus, and Dominion each send four direct qualifiers to National Finals; placements five through eight route into Wildcard."
    },
    {
      title: "Wildcard",
      state: "locked",
      body: "Wildcard produces the final four National Finals qualifiers, completing the 16-player single-elimination bracket."
    }
  ]
};
