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
    if (zoom >= 4) return 8; // Very zoomed in - show larger dots
    if (zoom >= 2.5) return 6; // Medium zoom
    if (zoom >= 1.5) return 4; // Light zoom
    return 3; // Default global view
  };

  // Determine if we should show city labels
  const shouldShowCityLabels = position.zoom >= 3;

  const markerSize = getMarkerSize(position.zoom);

  // Zoom controls
  const handleZoomIn = () => {
    setPosition(prev => ({
      ...prev,
      zoom: Math.min(prev.zoom * 1.5, 8)
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
                Every dot represents an individual member • Zoom in to see cities
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
              <span>Individual member location</span>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="font-semibold mb-1">Current Zoom: {position.zoom.toFixed(1)}x</p>
              <p className="text-gray-600 dark:text-gray-400">
                {position.zoom >= 3 ? '🏙️ City level detail' : position.zoom >= 1.5 ? '🌍 Country level view' : '🗺️ Global overview'}
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
          <p className="font-semibold mb-1">Map Controls:</p>
          <p>🖱️ Click & drag to pan</p>
          <p>🔍 Scroll to zoom</p>
          <p>📍 Click dots for member info</p>
          <p>🎯 Use buttons to zoom</p>
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
              maxZoom={8}
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

                return (
                  <Marker
                    key={`${member.id}-${index}`}
                    coordinates={[member.lng, member.lat]}
                  >
                    {/* Pulse animation for selected marker */}
                    {isSelected && (
                      <circle
                        r={markerSize + 3}
                        fill="#3b82f6"
                        opacity={0.3}
                        className="animate-ping"
                      />
                    )}
                    
                    {/* Main marker dot */}
                    <circle
                      r={markerSize}
                      fill="#3b82f6"
                      stroke="white"
                      strokeWidth={1.5}
                      className="cursor-pointer transition-all duration-200 hover:scale-150"
                      onClick={() => setSelectedMember(isSelected ? null : member.id)}
                      style={{
                        filter: isSelected 
                          ? 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.8))' 
                          : 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
                      }}
                    />

                    {/* City/Location labels at high zoom */}
                    {shouldShowCityLabels && member.city && (
                      <text
                        textAnchor="middle"
                        y={markerSize + 12}
                        className="text-[10px] font-semibold pointer-events-none"
                        fill="#1e40af"
                        style={{
                          textShadow: '0 0 3px white, 0 0 3px white, 0 0 3px white',
                        }}
                      >
                        {member.city}
                      </text>
                    )}
                    
                    {/* Member info tooltip on selection */}
                    {isSelected && (
                      <g>
                        <foreignObject
                          x={-120}
                          y={markerSize + 15}
                          width="240"
                          height="auto"
                        >
                          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-4 border-2 border-blue-500">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm text-gray-900 dark:text-white truncate">
                                  {member.name}
                                </p>
                                <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-1">
                                  <MapPin className="h-3 w-3" />
                                  {member.displayLocation}
                                </p>
                                {member.membershipType && (
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    {member.membershipType}
                                  </p>
                                )}
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 truncate">
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
