declare module "tz-lookup" {
  /**
   * Resolve a latitude/longitude to its IANA timezone name
   * (e.g. "America/New_York"). Throws on out-of-range coordinates.
   */
  export default function tzlookup(lat: number, lon: number): string;
}
