/**
 * Hard-coded location configuration for Dumai.
 * Per AGENTS.md:
 * Location is hard-coded once here: name "Kota Dumai", latitude 1.66711, longitude 101.44316.
 * Prayer times and weather always use this constant by coordinates, never by city name.
 * Do not read from env vars, database, or admin panel, and do not repeat numbers anywhere else.
 */
export const LOCATION = {
  nama: "Kota Dumai",
  latitude: 1.66711,
  longitude: 101.44316,
} as const;
