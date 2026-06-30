/**
 * Pure TypeScript Geohash encoder.
 * Encodes latitude and longitude into standard geohash string.
 */
export function encodeGeohash(lat: number, lng: number, precision: number = 7): string {
  const chars = '0123456789bcdefghjkmnpqrstuvwxyz';
  let minLat = -90, maxLat = 90;
  let minLng = -180, maxLng = 180;
  let geohash = '';
  let bit = 0;
  let ch = 0;
  let isEven = true;

  while (geohash.length < precision) {
    let mid;
    if (isEven) {
      mid = (minLng + maxLng) / 2;
      if (lng > mid) {
        ch |= (1 << (4 - bit));
        minLng = mid;
      } else {
        maxLng = mid;
      }
    } else {
      mid = (minLat + maxLat) / 2;
      if (lat > mid) {
        ch |= (1 << (4 - bit));
        minLat = mid;
      } else {
        maxLat = mid;
      }
    }

    isEven = !isEven;
    if (bit < 4) {
      bit++;
    } else {
      geohash += chars[ch];
      bit = 0;
      ch = 0;
    }
  }
  return geohash;
}
