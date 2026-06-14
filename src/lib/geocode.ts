// Geocoding utility using Nominatim (OpenStreetMap) - Free, no API key needed
// Rate limit: 1 request per second

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  if (!address || address.trim().length < 3) return null;

  try {
    const query = encodeURIComponent(address + ', Việt Nam');
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&countrycodes=vn`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MediBuk/1.0 (medical-booking-app)'
        }
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    if (!data || data.length === 0) return null;

    const place = data[0];
    return {
      lat: parseFloat(place.lat),
      lng: parseFloat(place.lon),
      displayName: place.display_name
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}
