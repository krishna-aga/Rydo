import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useRideStore } from '../store/useRideStore.js';
import { LANDMARK_COORDINATES } from '../utils/coordinates.js';

interface MapCanvasProps {
  pickupLocation?: string;
  destination?: string;
  onlineDrivers?: any[];
  assignedDriverId?: string;
}

// Utility to parse coordinate strings or resolve landmarks
const getCoordinatesForLocation = (locationName: string): [number, number] | null => {
  if (!locationName) return null;
  if (LANDMARK_COORDINATES[locationName]) {
    return LANDMARK_COORDINATES[locationName];
  }
  // Extract custom lat/lng coordinates format like "Custom Location (29.864, 77.892)"
  const match = locationName.match(/.*\(([^,]+),\s*([^)]+)\)/);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return [lat, lng];
    }
  }
  return null;
};

export default function MapCanvas({ pickupLocation, destination, onlineDrivers, assignedDriverId }: MapCanvasProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const routingPolylineRef = useRef<L.Polyline | null>(null);

  const { selectingOnMap } = useRideStore();

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

    // Map click listener for setting custom pickup or destination coordinates
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const rideStore = useRideStore.getState();
      
      if (rideStore.selectingOnMap === 'pickup') {
        rideStore.setTempPickup(`Custom Location (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
        rideStore.setSelectingOnMap(null);
      } else if (rideStore.selectingOnMap === 'destination') {
        rideStore.setTempDestination(`Custom Location (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
        rideStore.setSelectingOnMap(null);
      }
    });

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

    const pCoord = getCoordinatesForLocation(pickupLocation || '');
    if (pCoord) {
      points.push(pCoord);
      const marker = L.marker(pCoord, {
        icon: createCustomIcon('bg-indigo-500', 'Pickup')
      }).addTo(map);
      markersRef.current.push(marker);
    }

    const dCoord = getCoordinatesForLocation(destination || '');
    if (dCoord) {
      points.push(dCoord);
      const marker = L.marker(dCoord, {
        icon: createCustomIcon('bg-rose-500', 'Destination')
      }).addTo(map);
      markersRef.current.push(marker);
    }

    // Render online drivers
    if (onlineDrivers && onlineDrivers.length > 0) {
      onlineDrivers.forEach((driver) => {
        if (driver.latitude && driver.longitude) {
          const isAssigned = assignedDriverId === driver.id;
          const coord: [number, number] = [driver.latitude, driver.longitude];
          
          if (isAssigned) {
            points.push(coord);
          }

          const colorClass = isAssigned
            ? 'bg-amber-400 animate-pulse border-amber-300 scale-125'
            : 'bg-emerald-400 border border-emerald-500 shadow-lg';
          
          const label = isAssigned
            ? `⭐ ${driver.name || 'Assigned Driver'}`
            : `${driver.name || 'E-Rickshaw'}`;

          const marker = L.marker(coord, {
            icon: createCustomIcon(colorClass, label)
          }).addTo(map);
          markersRef.current.push(marker);
        }
      });
    }

    // Draw route if both pickup and destination are present
    if (pCoord && dCoord) {
      // Draw initial fallback straight dashed line
      const fallbackPolyline = L.polyline([pCoord, dCoord], {
        color: '#6366f1',
        weight: 4,
        opacity: 0.6,
        dashArray: '6, 10'
      }).addTo(map);
      routingPolylineRef.current = fallbackPolyline;

      // Fetch actual street path from OSRM
      fetch(`https://router.project-osrm.org/route/v1/driving/${pCoord[1]},${pCoord[0]};${dCoord[1]},${dCoord[0]}?overview=full&geometries=geojson`)
        .then(res => res.json())
        .then(data => {
          if (data && data.routes && data.routes[0] && data.routes[0].geometry) {
            const routeCoords = data.routes[0].geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]] as [number, number]);

            // Remove fallback polyline
            if (routingPolylineRef.current) {
              routingPolylineRef.current.remove();
            }

            // Draw street-accurate polyline
            const streetPolyline = L.polyline(routeCoords, {
              color: '#818cf8',
              weight: 5,
              opacity: 0.95,
              lineJoin: 'round',
              lineCap: 'round'
            }).addTo(map);
            routingPolylineRef.current = streetPolyline;

            // Adjust bounds to fit the full route and any assigned driver
            const boundsPoints: [number, number][] = [...points, ...routeCoords];
            map.fitBounds(L.latLngBounds(boundsPoints), { padding: [50, 50] });
          }
        })
        .catch(err => {
          console.error('Failed to fetch street route from OSRM:', err);
        });
    }

    // Adjust bounds
    if (points.length >= 2) {
      map.fitBounds(L.latLngBounds(points), { padding: [50, 50] });
    } else if (points.length === 1) {
      map.setView(points[0], 16);
    }

  }, [pickupLocation, destination, onlineDrivers, assignedDriverId]);

  return (
    <div className="w-full h-full relative overflow-hidden rounded-2xl border border-slate-800 shadow-2xl">
      <div ref={mapContainerRef} className="w-full h-full bg-slate-950" />
      
      <div className="absolute top-4 left-4 z-[400] bg-slate-900/80 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span className="text-xs font-semibold text-slate-300">IIT Roorkee Operations Grid</span>
      </div>

      {selectingOnMap && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[400] bg-indigo-600/90 text-white backdrop-blur-md border border-indigo-400/30 px-5 py-2 rounded-full shadow-2xl flex items-center gap-2 animate-bounce">
          <span className="text-sm">📍</span>
          <span className="text-xs font-bold uppercase tracking-wider">
            Click on the map to set {selectingOnMap === 'pickup' ? 'Pickup' : 'Destination'}
          </span>
        </div>
      )}
    </div>
  );
}
