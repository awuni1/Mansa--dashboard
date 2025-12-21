'use client';

import { useState, useMemo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Users, MapPin, ZoomIn, ZoomOut, Navigation } from 'lucide-react';
import { getCityCoordinates, getRandomOffset, countryCoordinates } from '@/lib/cityCoordinates';

export interface MemberLocation {
  id: string;
  name: string;
  country?: string;
  city?: string;
  email: string;
  membershipType?: string;
}

interface WorldMapProps {
  members: MemberLocation[];
  className?: string;
}

interface ProcessedMember extends MemberLocation {
  lat: number;
  lng: number;
  displayLocation: string;
}

export default function WorldMap({ members, className = '' }: WorldMapProps) {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [position, setPosition] = useState<{ coordinates: [number, number]; zoom: number }>({ 
    coordinates: [0, 20], 
    zoom: 1 
  });

  // Process each member to get individual coordinates
  const processedMembers = useMemo(() => {
    const processed: ProcessedMember[] = [];
    const cityMemberCount = new Map<string, number>();

    members.forEach(member => {
      if (!member.country) return;

      const normalizedCountry = member.country.trim();
      let lat: number, lng: number;
      let displayLocation = normalizedCountry;

      // Try to get city coordinates first
      if (member.city) {
        const normalizedCity = member.city.trim();
        const cityKey = `${normalizedCity}, ${normalizedCountry}`;
        const cityCoords = getCityCoordinates(normalizedCity, normalizedCountry);
        
        if (cityCoords) {
          lat = cityCoords.lat;
          lng = cityCoords.lng;
          displayLocation = `${normalizedCity}, ${normalizedCountry}`;

          // Add small offset if multiple members in same city
          const count = cityMemberCount.get(cityKey) || 0;
          const offset = getRandomOffset(count, 20);
          lat += offset.lat;
          lng += offset.lng;
          cityMemberCount.set(cityKey, count + 1);
        } else {
          // Fallback to country coordinates
          const countryCoords = countryCoordinates[normalizedCountry];
          if (!countryCoords) return;
          lat = countryCoords.lat;
          lng = countryCoords.lng;
          
          // Add random offset for country-level markers
          const count = cityMemberCount.get(normalizedCountry) || 0;
          const offset = getRandomOffset(count, 50);
          lat += offset.lat;
          lng += offset.lng;
          cityMemberCount.set(normalizedCountry, count + 1);
        }
      } else {
        // No city provided, use country coordinates
        const countryCoords = countryCoordinates[normalizedCountry];
        if (!countryCoords) return;
        lat = countryCoords.lat;
        lng = countryCoords.lng;
        
        // Add random offset for country-level markers
        const count = cityMemberCount.get(normalizedCountry) || 0;
        const offset = getRandomOffset(count, 50);
        lat += offset.lat;
        lng += offset.lng;
        cityMemberCount.set(normalizedCountry, count + 1);
      }

      processed.push({
        ...member,
        lat,
        lng,
        displayLocation,
      });
    });

    return processed;
  }, [members]);

  // Group members by location for statistics
  const locationStats = useMemo(() => {
    const countries = new Set(processedMembers.map(m => m.country).filter(Boolean));
    const cities = new Set(processedMembers.filter(m => m.city).map(m => `${m.city}, ${m.country}`));
    
    return {
      totalCountries: countries.size,
      totalCities: cities.size,
      totalMembers: processedMembers.length,
    };
  }, [processedMembers]);

  // Determine marker size based on zoom level
  const getMarkerSize = (zoom: number) => {
    if (zoom >= 6) return 10; // Very zoomed in - show larger dots for individual visibility
    if (zoom >= 4) return 8; // City level - clear individual dots
    if (zoom >= 2.5) return 6; // Regional zoom
    if (zoom >= 1.5) return 4; // Country zoom
    return 3; // Default global view
  };

  // Determine if we should show city labels
  const shouldShowCityLabels = position.zoom >= 2.5; // Show labels at medium zoom
  const shouldShowCountryLabels = position.zoom < 2; // Show country info at low zoom

  const markerSize = getMarkerSize(position.zoom);

  // Zoom controls with better increments
  const handleZoomIn = () => {
    setPosition(prev => ({
      ...prev,
      zoom: Math.min(prev.zoom * 1.5, 10) // Increased max zoom to 10
    }));
  };

  const handleZoomOut = () => {
    setPosition(prev => ({
      ...prev,
      zoom: Math.max(prev.zoom / 1.5, 1)
    }));
  };

  const handleResetZoom = () => {
    setPosition({ coordinates: [0, 20], zoom: 1 });
  };

  // Zoom to specific location (city or country)
  const handleZoomToLocation = (lng: number, lat: number, zoomLevel: number = 5) => {
    setPosition({
      coordinates: [lng, lat],
      zoom: zoomLevel
    });
  };

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Global Member Distribution</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Each dot = 1 member • Zoom in to see individual cities and towns
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="text-center px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{locationStats.totalCountries}</div>
              <div className="text-gray-600 dark:text-gray-400">Countries</div>
            </div>
            <div className="text-center px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{locationStats.totalCities}</div>
              <div className="text-gray-600 dark:text-gray-400">Cities</div>
            </div>
            <div className="text-center px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{locationStats.totalMembers}</div>
              <div className="text-gray-600 dark:text-gray-400">Members</div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 relative bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Legend */}
        <div className="absolute top-4 left-4 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-xs">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Map Legend
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-600"></div>
              <span>1 dot = 1 member</span>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="font-semibold mb-1">Zoom: {position.zoom.toFixed(1)}x</p>
              <p className="text-gray-600 dark:text-gray-400">
                {position.zoom >= 4 ? '🏘️ Street/City view' : 
                 position.zoom >= 2.5 ? '🏙️ City view' :
                 position.zoom >= 1.5 ? '🌍 Country view' : 
                 '🗺️ Global view'}
              </p>
            </div>
          </div>
          {hoveredCountry && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="font-semibold text-blue-600 dark:text-blue-400">{hoveredCountry}</p>
            </div>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          <button
            onClick={handleZoomIn}
            className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
            title="Reset View"
          >
            <Navigation className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        {/* Map Controls Info */}
        <div className="absolute bottom-4 right-4 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 text-xs text-gray-600 dark:text-gray-400">
          <p className="font-semibold mb-1">🗺️ Map Controls:</p>
          <p>🖱️ Drag to pan map</p>
          <p>🔍 Scroll wheel to zoom</p>
          <p>📍 Click dot for member details</p>
          <p>➕➖ Use buttons for precise zoom</p>
          <p className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 font-semibold text-blue-600">
            Zoom in to see cities & towns!
          </p>
        </div>

        <div className="relative" style={{ height: '650px' }}>
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              scale: 147,
              center: [0, 20]
            }}
            className="w-full h-full"
          >
            <ZoomableGroup
              zoom={position.zoom}
              center={position.coordinates}
              onMoveEnd={(newPosition) => setPosition(newPosition)}
              maxZoom={10}
              minZoom={1}
            >
              {/* World Geography */}
              <Geographies geography="/world-110m.json">
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const isHovered = hoveredCountry === geo.properties.name;
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        onMouseEnter={() => setHoveredCountry(geo.properties.name)}
                        onMouseLeave={() => setHoveredCountry(null)}
                        style={{
                          default: {
                            fill: isHovered ? '#e0f2fe' : '#f8fafc',
                            stroke: '#cbd5e1',
                            strokeWidth: 0.5,
                            outline: 'none',
                          },
                          hover: {
                            fill: '#e0f2fe',
                            stroke: '#3b82f6',
                            strokeWidth: 1,
                            outline: 'none',
                          },
                          pressed: {
                            fill: '#bfdbfe',
                            stroke: '#3b82f6',
                            strokeWidth: 1,
                            outline: 'none',
                          },
                        }}
                      />
                    );
                  })
                }
              </Geographies>

              {/* Individual Member Markers */}
              {processedMembers.map((member, index) => {
                const isSelected = selectedMember === member.id;
                const showLabel = shouldShowCityLabels && member.city;

                return (
                  <Marker
                    key={`${member.id}-${index}`}
                    coordinates={[member.lng, member.lat]}
                  >
                    {/* Pulse animation for selected marker */}
                    {isSelected && (
                      <circle
                        r={markerSize + 4}
                        fill="#3b82f6"
                        opacity={0.3}
                        className="animate-ping"
                      />
                    )}
                    
                    {/* Main marker dot - Represents 1 member */}
                    <circle
                      r={markerSize}
                      fill={isSelected ? "#ef4444" : "#3b82f6"}
                      stroke="white"
                      strokeWidth={position.zoom >= 4 ? 2 : 1.5}
                      className="cursor-pointer transition-all duration-200 hover:scale-150 hover:fill-red-500"
                      onClick={() => {
                        setSelectedMember(isSelected ? null : member.id);
                        // Zoom to member location when clicked
                        if (!isSelected && position.zoom < 4) {
                          handleZoomToLocation(member.lng, member.lat, 5);
                        }
                      }}
                      style={{
                        filter: isSelected 
                          ? 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.9))' 
                          : 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
                      }}
                    />

                    {/* City/Location labels at medium-high zoom */}
                    {showLabel && (
                      <text
                        textAnchor="middle"
                        y={markerSize + 14}
                        className="text-[11px] font-bold pointer-events-none select-none"
                        fill="#1e40af"
                        style={{
                          textShadow: '0 0 4px white, 0 0 4px white, 0 0 4px white, 0 0 4px white',
                        }}
                      >
                        {member.city}
                      </text>
                    )}
                    
                    {/* Member info tooltip on selection */}
                    {isSelected && (
                      <g>
                        <foreignObject
                          x={-130}
                          y={markerSize + 18}
                          width="260"
                          height="auto"
                        >
                          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-4 border-2 border-red-500 animate-in fade-in duration-200">
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                <Users className="h-6 w-6 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-base text-gray-900 dark:text-white truncate">
                                  {member.name}
                                </p>
                                <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-1">
                                  <MapPin className="h-4 w-4" />
                                  {member.displayLocation}
                                </p>
                                {member.membershipType && (
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                                    {member.membershipType}
                                  </p>
                                )}
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 truncate">
                                  {member.email}
                                </p>
                              </div>
                            </div>
                          </div>
                        </foreignObject>
                      </g>
                    )}
                  </Marker>
                );
              })}
            </ZoomableGroup>
          </ComposableMap>
        </div>

        {/* Statistics Footer */}
        <div className="border-t bg-gray-50 dark:bg-gray-800 p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Total Members</p>
              <p className="font-bold text-blue-600 dark:text-blue-400 text-lg">
                {locationStats.totalMembers}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Countries</p>
              <p className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">
                {locationStats.totalCountries}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Cities Tracked</p>
              <p className="font-bold text-purple-600 dark:text-purple-400 text-lg">
                {locationStats.totalCities}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Zoom Level</p>
              <p className="font-bold text-pink-600 dark:text-pink-400 text-lg">
                {position.zoom.toFixed(1)}x
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
