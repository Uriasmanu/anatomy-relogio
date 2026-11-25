export const RATED = {
  S: 25e6,
  Vp: 69000,
  Vs: 13800,
  Hz: 60,
  Np: 1039,
  Ns: 120,
  B: 1.7,
  P0: 18e3,
  Pk: 95e3,
  ambient: 30,
  rise: 55,
  exponent: 0.8,
  onAt: 75,
  offAt: 65,
  onanRise: 1.25,
  taps: 9,
  tapStep: 0.0125,
};

export const TAP_MID = (RATED.taps - 1) / 2;
export const tapFraction = (tap) => (tap - TAP_MID) * RATED.tapStep;
export const turnsHV = (tap) => Math.round(RATED.Np * (1 + tapFraction(tap)));
export const lineVoltageLV = (tap) => (Math.sqrt(3) * RATED.Vp * RATED.Ns) / turnsHV(tap);
export const currentLV = (tap, load) => (load * RATED.S) / (Math.sqrt(3) * lineVoltageLV(tap));
export const currentHV = (load) => (load * RATED.S) / (Math.sqrt(3) * RATED.Vp);
export const fluxDensity = (tap) => RATED.B / (1 + tapFraction(tap));
export const copperLoss = (load) => RATED.Pk * load * load;
export const totalLoss = (load) => RATED.P0 + copperLoss(load);
export const efficiency = (load) => (load * RATED.S) / (load * RATED.S + totalLoss(load));

export function steadyOil(load, fans) {
  const ratio = RATED.Pk / RATED.P0;
  const shape = ((load * load * ratio + 1) / (ratio + 1)) ** RATED.exponent;
  return RATED.ambient + RATED.rise * shape * (fans ? 1 : RATED.onanRise);
}

export function fansWanted(oil, running) {
  if (oil >= RATED.onAt) return true;
  if (oil <= RATED.offAt) return false;
  return running;
}

export const OIL_TAU = 7;
