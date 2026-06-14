'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet icons issues by using HTML/CSS custom icons
const markerIcon = (color: string) => L.divIcon({
  html: `
    <div class="flex items-center justify-center">
      <span class="absolute flex h-6 w-6">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-${color}-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-4 w-4 bg-${color}-600 border border-white shadow-lg"></span>
      </span>
    </div>
  `,
  className: 'custom-leaflet-icon',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

interface MapProps {
  center: [number, number];
  markers?: {
    lat: number;
    lng: number;
    title: string;
    description?: string;
    color?: 'emerald' | 'blue' | 'rose' | 'amber';
  }[];
  onLocationSelect?: (lat: number, lng: number) => void;
  zoom?: number;
}

// Controller to update center when prop changes
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

// Listener for clicks to select location
function MapClickHandler({ onSelect }: { onSelect?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (onSelect) {
        onSelect(e.latlng.lat, e.latlng.lng);
      }
    }
  });
  return null;
}

export default function Map({ center, markers = [], onLocationSelect, zoom = 13 }: MapProps) {
  // Use client state to resolve hydrated mismatch issues
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-full w-full bg-slate-100 flex items-center justify-center text-sm text-slate-500 rounded-2xl animate-pulse">
        Đang tải bản đồ...
      </div>
    );
  }

  const getMarkerColor = (color: string) => {
    if (color === 'emerald') return 'emerald';
    if (color === 'blue') return 'blue';
    if (color === 'rose') return 'rose';
    return 'amber';
  };

  return (
    <div className="h-full w-full min-h-[350px] relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="h-full w-full z-10"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController center={center} />
        {onLocationSelect && <MapClickHandler onSelect={onLocationSelect} />}

        {markers.map((marker, index) => (
          <Marker
            key={index}
            position={[marker.lat, marker.lng]}
            icon={markerIcon(getMarkerColor(marker.color || 'blue'))}
          >
            <Popup>
              <div className="p-1">
                <h4 className="font-bold text-slate-900 text-sm">{marker.title}</h4>
                {marker.description && <p className="text-slate-600 text-xs mt-1">{marker.description}</p>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
