import { useEffect, useRef } from 'react';
import L from 'leaflet';

interface MapCanvasProps {
  pickupLocation?: string;
  destination?: string;
}

// Coordinate mappings for IIT Roorkee landmarks
export const LANDMARK_COORDINATES: Record<string, [number, number]> = {
  'Main Gate': [29.8643, 77.8965],
  'Govind Bhawan': [29.8659, 77.8943],
  'Rajendra Bhawan': [29.8621, 77.8981],
  'Ravindra Bhawan': [29.8681, 77.8931],
  'Lecture Hall Complex': [29.8649, 77.8955],
  'Library': [29.8638, 77.8960]
};

export default function MapCanvas({ pickupLocation, destination }: MapCanvasProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const routingPolylineRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Leaflet map centered at IIT Roorkee
    const map = L.map(mapContainerRef.current, {
      center: [29.8645, 77.8950],
      zoom: 15,
      zoomControl: false
    });

    // Dark-themed tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers and routing on prop changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    if (routingPolylineRef.current) {
      routingPolylineRef.current.remove();
      routingPolylineRef.current = null;
    }

    const points: [number, number][] = [];

    const createCustomIcon = (colorClass: string, label: string) => {
      return L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="flex flex-col items-center">
                 <div class="px-2 py-0.5 rounded text-[10px] font-bold text-white bg-slate-900 border border-slate-700 shadow-md whitespace-nowrap">${label}</div>
                 <div class="w-3.5 h-3.5 rounded-full ${colorClass} border-2 border-white -mt-0.5 shadow-md"></div>
               </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40]
      });
    };

    if (pickupLocation && LANDMARK_COORDINATES[pickupLocation]) {
      const coord = LANDMARK_COORDINATES[pickupLocation];
      points.push(coord);
      const marker = L.marker(coord, {
        icon: createCustomIcon('bg-indigo-500', 'Pickup')
      }).addTo(map);
      markersRef.current.push(marker);
    }

    if (destination && LANDMARK_COORDINATES[destination]) {
      const coord = LANDMARK_COORDINATES[destination];
      points.push(coord);
      const marker = L.marker(coord, {
        icon: createCustomIcon('bg-rose-500', 'Destination')
      }).addTo(map);
      markersRef.current.push(marker);
    }

    // Draw route if both are present
    if (points.length === 2) {
      const polyline = L.polyline(points, {
        color: '#6366f1',
        weight: 4,
        opacity: 0.8,
        dashArray: '8, 12'
      }).addTo(map);
      routingPolylineRef.current = polyline;

      map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
    } else if (points.length === 1) {
      map.setView(points[0], 16);
    }

    // Spawn mock e-rickshaw drivers if no active route is mapped
    if (points.length === 0) {
      const mockDrivers: [number, number][] = [
        [29.8635, 77.8935],
        [29.8655, 77.8970],
        [29.8625, 77.8955]
      ];
      mockDrivers.forEach((coord, idx) => {
        const marker = L.marker(coord, {
          icon: createCustomIcon('bg-emerald-400 border border-emerald-500 shadow-lg', `E-Rickshaw #${idx + 104}`)
        }).addTo(map);
        markersRef.current.push(marker);
      });
    }

  }, [pickupLocation, destination]);

  return (
    <div className="w-full h-full relative overflow-hidden rounded-2xl border border-slate-800 shadow-2xl">
      <div ref={mapContainerRef} className="w-full h-full bg-slate-950" />
      
      <div className="absolute top-4 left-4 z-[400] bg-slate-900/80 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span className="text-xs font-semibold text-slate-300">IIT Roorkee Operations Grid</span>
      </div>
    </div>
  );
}
