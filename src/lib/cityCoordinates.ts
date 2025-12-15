// Comprehensive city coordinates database for member locations
// This includes major cities worldwide to pinpoint exact member locations

export interface CityCoordinate {
  lat: number;
  lng: number;
  city: string;
  country: string;
}

// City coordinates organized by country for quick lookup
export const cityCoordinates: Record<string, CityCoordinate[]> = {
  // Ghana
  'Ghana': [
    { lat: 5.6037, lng: -0.1870, city: 'Accra', country: 'Ghana' },
    { lat: 6.6885, lng: -1.6244, city: 'Kumasi', country: 'Ghana' },
    { lat: 5.1035, lng: -1.2466, city: 'Takoradi', country: 'Ghana' },
    { lat: 5.6342, lng: 0.1068, city: 'Tema', country: 'Ghana' },
    { lat: 9.4034, lng: -0.8393, city: 'Tamale', country: 'Ghana' },
    { lat: 7.3389, lng: -2.3333, city: 'Sunyani', country: 'Ghana' },
    { lat: 6.0802, lng: 0.2769, city: 'Ho', country: 'Ghana' },
  ],
  
  // Nigeria
  'Nigeria': [
    { lat: 6.5244, lng: 3.3792, city: 'Lagos', country: 'Nigeria' },
    { lat: 9.0579, lng: 7.4951, city: 'Abuja', country: 'Nigeria' },
    { lat: 7.3775, lng: 3.9470, city: 'Ibadan', country: 'Nigeria' },
    { lat: 12.0022, lng: 8.5919, city: 'Kano', country: 'Nigeria' },
    { lat: 6.3350, lng: 5.6037, city: 'Benin City', country: 'Nigeria' },
    { lat: 5.3166, lng: 7.0330, city: 'Port Harcourt', country: 'Nigeria' },
    { lat: 7.8731, lng: 5.0557, city: 'Abeokuta', country: 'Nigeria' },
    { lat: 11.8333, lng: 13.1667, city: 'Maiduguri', country: 'Nigeria' },
  ],
  
  // Kenya
  'Kenya': [
    { lat: -1.2921, lng: 36.8219, city: 'Nairobi', country: 'Kenya' },
    { lat: -4.0435, lng: 39.6682, city: 'Mombasa', country: 'Kenya' },
    { lat: -0.0917, lng: 34.7680, city: 'Kisumu', country: 'Kenya' },
    { lat: 0.5143, lng: 35.2698, city: 'Eldoret', country: 'Kenya' },
    { lat: -0.2830, lng: 36.0670, city: 'Nakuru', country: 'Kenya' },
  ],
  
  // South Africa
  'South Africa': [
    { lat: -33.9249, lng: 18.4241, city: 'Cape Town', country: 'South Africa' },
    { lat: -26.2041, lng: 28.0473, city: 'Johannesburg', country: 'South Africa' },
    { lat: -29.8587, lng: 31.0218, city: 'Durban', country: 'South Africa' },
    { lat: -25.7479, lng: 28.2293, city: 'Pretoria', country: 'South Africa' },
    { lat: -33.9608, lng: 25.6022, city: 'Port Elizabeth', country: 'South Africa' },
  ],
  
  // United States
  'United States': [
    { lat: 40.7128, lng: -74.0060, city: 'New York', country: 'United States' },
    { lat: 34.0522, lng: -118.2437, city: 'Los Angeles', country: 'United States' },
    { lat: 41.8781, lng: -87.6298, city: 'Chicago', country: 'United States' },
    { lat: 29.7604, lng: -95.3698, city: 'Houston', country: 'United States' },
    { lat: 33.4484, lng: -112.0740, city: 'Phoenix', country: 'United States' },
    { lat: 39.7392, lng: -104.9903, city: 'Denver', country: 'United States' },
    { lat: 37.7749, lng: -122.4194, city: 'San Francisco', country: 'United States' },
    { lat: 47.6062, lng: -122.3321, city: 'Seattle', country: 'United States' },
    { lat: 42.3601, lng: -71.0589, city: 'Boston', country: 'United States' },
    { lat: 38.9072, lng: -77.0369, city: 'Washington', country: 'United States' },
    { lat: 33.7490, lng: -84.3880, city: 'Atlanta', country: 'United States' },
    { lat: 25.7617, lng: -80.1918, city: 'Miami', country: 'United States' },
  ],
  
  // United Kingdom
  'United Kingdom': [
    { lat: 51.5074, lng: -0.1278, city: 'London', country: 'United Kingdom' },
    { lat: 53.4808, lng: -2.2426, city: 'Manchester', country: 'United Kingdom' },
    { lat: 52.4862, lng: -1.8904, city: 'Birmingham', country: 'United Kingdom' },
    { lat: 53.8008, lng: -1.5491, city: 'Leeds', country: 'United Kingdom' },
    { lat: 55.9533, lng: -3.1883, city: 'Edinburgh', country: 'United Kingdom' },
    { lat: 51.4545, lng: -2.5879, city: 'Bristol', country: 'United Kingdom' },
  ],
  
  // Canada
  'Canada': [
    { lat: 43.6532, lng: -79.3832, city: 'Toronto', country: 'Canada' },
    { lat: 45.5017, lng: -73.5673, city: 'Montreal', country: 'Canada' },
    { lat: 49.2827, lng: -123.1207, city: 'Vancouver', country: 'Canada' },
    { lat: 51.0447, lng: -114.0719, city: 'Calgary', country: 'Canada' },
    { lat: 45.4215, lng: -75.6972, city: 'Ottawa', country: 'Canada' },
  ],
  
  // India
  'India': [
    { lat: 28.6139, lng: 77.2090, city: 'New Delhi', country: 'India' },
    { lat: 19.0760, lng: 72.8777, city: 'Mumbai', country: 'India' },
    { lat: 12.9716, lng: 77.5946, city: 'Bangalore', country: 'India' },
    { lat: 22.5726, lng: 88.3639, city: 'Kolkata', country: 'India' },
    { lat: 13.0827, lng: 80.2707, city: 'Chennai', country: 'India' },
    { lat: 17.3850, lng: 78.4867, city: 'Hyderabad', country: 'India' },
  ],
  
  // Germany
  'Germany': [
    { lat: 52.5200, lng: 13.4050, city: 'Berlin', country: 'Germany' },
    { lat: 48.1351, lng: 11.5820, city: 'Munich', country: 'Germany' },
    { lat: 50.1109, lng: 8.6821, city: 'Frankfurt', country: 'Germany' },
    { lat: 53.5511, lng: 9.9937, city: 'Hamburg', country: 'Germany' },
  ],
  
  // France
  'France': [
    { lat: 48.8566, lng: 2.3522, city: 'Paris', country: 'France' },
    { lat: 43.2965, lng: 5.3698, city: 'Marseille', country: 'France' },
    { lat: 45.7640, lng: 4.8357, city: 'Lyon', country: 'France' },
  ],
  
  // Australia
  'Australia': [
    { lat: -33.8688, lng: 151.2093, city: 'Sydney', country: 'Australia' },
    { lat: -37.8136, lng: 144.9631, city: 'Melbourne', country: 'Australia' },
    { lat: -27.4698, lng: 153.0251, city: 'Brisbane', country: 'Australia' },
    { lat: -31.9505, lng: 115.8605, city: 'Perth', country: 'Australia' },
  ],
  
  // Add more countries and cities as needed
};

// Function to find coordinates for a city
export function getCityCoordinates(city: string, country: string): { lat: number; lng: number } | null {
  const normalizedCountry = country.trim();
  const normalizedCity = city.trim().toLowerCase();
  
  const countryCities = cityCoordinates[normalizedCountry];
  if (!countryCities) return null;
  
  const cityData = countryCities.find(c => c.city.toLowerCase() === normalizedCity);
  if (cityData) {
    return { lat: cityData.lat, lng: cityData.lng };
  }
  
  return null;
}

// Function to get a random offset for overlapping markers
export function getRandomOffset(index: number, total: number): { lat: number; lng: number } {
  const angle = (index / total) * 2 * Math.PI;
  const radius = 0.05; // Small radius for clustering
  return {
    lat: Math.cos(angle) * radius,
    lng: Math.sin(angle) * radius,
  };
}

// Function to find country center coordinates (fallback)
export const countryCoordinates: Record<string, { lat: number; lng: number }> = {
  'Ghana': { lat: 7.9465, lng: -1.0232 },
  'Nigeria': { lat: 9.0820, lng: 8.6753 },
  'Kenya': { lat: -0.0236, lng: 37.9062 },
  'South Africa': { lat: -30.5595, lng: 22.9375 },
  'Egypt': { lat: 26.8206, lng: 30.8025 },
  'United States': { lat: 37.0902, lng: -95.7129 },
  'USA': { lat: 37.0902, lng: -95.7129 },
  'United Kingdom': { lat: 55.3781, lng: -3.4360 },
  'UK': { lat: 55.3781, lng: -3.4360 },
  'Canada': { lat: 56.1304, lng: -106.3468 },
  'Germany': { lat: 51.1657, lng: 10.4515 },
  'France': { lat: 46.2276, lng: 2.2137 },
  'India': { lat: 20.5937, lng: 78.9629 },
  'China': { lat: 35.8617, lng: 104.1954 },
  'Australia': { lat: -25.2744, lng: 133.7751 },
  'Brazil': { lat: -14.2350, lng: -51.9253 },
};
