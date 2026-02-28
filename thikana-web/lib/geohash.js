import ngeohash from "ngeohash";

/**
 * Encode a lat/lon into a precision-5 geohash cell.
 * Must match the precision used by the Python backend (config.GEOHASH_PRECISION = 5).
 * Precision 5 covers ~5×5 km area.
 */
export function encodeGeohash(lat, lon, precision = 5) {
  return ngeohash.encode(lat, lon, precision);
}
