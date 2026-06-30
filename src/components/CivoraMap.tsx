import { useEffect, useRef } from 'react';
import L from 'leaflet';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description: string;
  category: string;
  status?: string;
}

export interface MapHotspot {
  id: string;
  name: string;
  geohash: string;
  riskLevel: 'red' | 'orange' | 'yellow' | 'green';
  lat: number;
  lng: number;
  clusterCount: number;
}

interface CivoraMapProps {
  center?: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  hotspots?: MapHotspot[];
  hotspotOverlayEnabled?: boolean;
  selectedHotspotId?: string | null;
  onHotspotSelect?: (id: string, geohash: string) => void;
  onLocationSelect?: (lat: number, lng: number) => void;
  selectedLocation?: { lat: number; lng: number } | null;
  interactive?: boolean;
  fitBounds?: boolean;
  idSuffix?: string;
}

const createActivePinIcon = (category: string) => {
  const colors: Record<string, string> = {
    water: '#3b82f6',
    lighting: '#eab308',
    roads: '#f97316',
    default: '#06b6d4'
  };
  const color = colors[category] || colors.default;

  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center">
        <span class="absolute inline-flex h-6 w-6 rounded-full" style="background-color: ${color}40; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div class="relative text-white p-1 rounded-full shadow-lg flex items-center justify-center border border-white/60" style="background-color: ${color};">
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
      </div>
    `,
    className: 'custom-pin-container',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

const createManualPinIcon = () => {
  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center">
        <span class="absolute inline-flex h-8 w-8 rounded-full bg-amber-500/40 animate-ping"></span>
        <div class="relative bg-amber-500 border-2 border-white text-slate-950 p-1.5 rounded-full shadow-xl flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
      </div>
    `,
    className: 'custom-pin-container',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
};

export default function CivoraMap({
  center = [12.971598, 77.594562], // Defaults to Bengaluru
  zoom = 13,
  markers = [],
  hotspots = [],
  hotspotOverlayEnabled = true,
  selectedHotspotId = null,
  onHotspotSelect,
  onLocationSelect,
  selectedLocation = null,
  interactive = true,
  fitBounds = false,
  idSuffix = 'global'
}: CivoraMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const hotspotsGroupRef = useRef<L.LayerGroup | null>(null);
  const manualPinRef = useRef<L.Marker | null>(null);

  // Store callbacks in refs to prevent map rebuild on parent re-renders
  const onLocationSelectRef = useRef(onLocationSelect);
  const onHotspotSelectRef = useRef(onHotspotSelect);

  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  useEffect(() => {
    onHotspotSelectRef.current = onHotspotSelect;
  }, [onHotspotSelect]);

  // Initialize Map
  useEffect(() => {
    if (!containerRef.current) return;

    // Create unique map container id to avoid multiple instances error
    const mapId = `leaflet-map-container-${idSuffix}`;
    containerRef.current.id = mapId;

    // Clean up if map exists
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapId, {
      center,
      zoom,
      zoomControl: interactive,
      dragging: interactive,
      scrollWheelZoom: interactive,
      doubleClickZoom: interactive,
      boxZoom: interactive,
      attributionControl: true
    });

    // Dark-themed tiles matches beautiful Cyberpunk HUD layout
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);

    // Create feature groups
    const layerGroup = L.layerGroup().addTo(map);
    const hotspotsGroup = L.layerGroup().addTo(map);

    layerGroupRef.current = layerGroup;
    hotspotsGroupRef.current = hotspotsGroup;
    mapInstanceRef.current = map;

    // Manual click selection
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      if (onLocationSelectRef.current) {
        onLocationSelectRef.current(lat, lng);
      }
    });

    // Adjust view when bounds container changes size
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [idSuffix, interactive]);

  // Sync center and zoom
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map) {
      map.setView(center, zoom);
    }
  }, [center, zoom]);

  // Sync Markers and Hotspots
  const markersString = JSON.stringify(markers.map(m => `${m.id}-${m.lat}-${m.lng}-${m.category}-${m.status || ''}`));
  const hotspotsString = JSON.stringify(hotspots.map(h => `${h.id}-${h.lat}-${h.lng}-${h.riskLevel}-${h.clusterCount}`));

  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    const hotspotsGroup = hotspotsGroupRef.current;

    if (!map || !layerGroup || !hotspotsGroup) return;

    // Clear previous elements
    layerGroup.clearLayers();
    hotspotsGroup.clearLayers();

    // 1. Plot Active Complaints
    const bounds: L.LatLngTuple[] = [];

    markers.forEach(marker => {
      if (typeof marker.lat !== 'number' || typeof marker.lng !== 'number' || isNaN(marker.lat) || isNaN(marker.lng)) return;
      
      const icon = createActivePinIcon(marker.category);
      const leafletMarker = L.marker([marker.lat, marker.lng], { icon })
        .bindPopup(`
          <div class="text-slate-900 p-2 font-sans max-w-[200px]">
            <h6 class="font-bold text-xs">${marker.title}</h6>
            <p class="text-[10px] text-slate-600 mt-1">${marker.description}</p>
            <span class="inline-block bg-slate-100 text-[8px] font-mono font-bold mt-1.5 px-1.5 py-0.5 rounded border uppercase">
              ${marker.category}
            </span>
          </div>
        `);
      
      layerGroup.addLayer(leafletMarker);
      bounds.push([marker.lat, marker.lng]);
    });

    // 2. Plot AI Hotspots (translucent circles + core indicators)
    if (hotspotOverlayEnabled) {
      hotspots.forEach(spot => {
        if (typeof spot.lat !== 'number' || typeof spot.lng !== 'number' || isNaN(spot.lat) || isNaN(spot.lng)) return;

        const colorMap = {
          red: '#f43f5e',
          orange: '#f59e0b',
          yellow: '#eab308',
          green: '#10b981'
        };
        const color = colorMap[spot.riskLevel] || colorMap.green;
        const fillOpacity = spot.riskLevel === 'red' ? 0.22 : spot.riskLevel === 'orange' ? 0.18 : spot.riskLevel === 'yellow' ? 0.12 : 0.08;

        const isSelected = selectedHotspotId === spot.id;

        // Draw translucent sector circle
        const circle = L.circle([spot.lat, spot.lng], {
          radius: isSelected ? 400 : 250,
          color: isSelected ? '#22d3ee' : color,
          weight: isSelected ? 2 : 1,
          fillColor: color,
          fillOpacity,
          className: 'transition-all duration-300'
        });

        // Click interaction
        circle.on('click', () => {
          if (onHotspotSelectRef.current) {
            onHotspotSelectRef.current(spot.id, spot.geohash);
          }
        });

        hotspotsGroup.addLayer(circle);

        // Draw center dot
        const centerIcon = L.divIcon({
          html: `<div style="background-color: ${color}; width: 8px; height: 8px; border-radius: 50%; border: 1px solid white;"></div>`,
          className: 'custom-center-dot',
          iconSize: [8, 8],
          iconAnchor: [4, 4]
        });

        const centerMarker = L.marker([spot.lat, spot.lng], { icon: centerIcon })
          .bindTooltip(`Sector ${spot.geohash}: ${spot.name}`, { permanent: false, direction: 'top' });

        centerMarker.on('click', () => {
          if (onHotspotSelectRef.current) {
            onHotspotSelectRef.current(spot.id, spot.geohash);
          }
        });

        hotspotsGroup.addLayer(centerMarker);
        bounds.push([spot.lat, spot.lng]);
      });
    }

    // 3. Plot Selected Manual Location Pin (if creating complaint)
    if (selectedLocation) {
      if (manualPinRef.current) {
        manualPinRef.current.setLatLng([selectedLocation.lat, selectedLocation.lng]);
      } else {
        const manualIcon = createManualPinIcon();
        const pin = L.marker([selectedLocation.lat, selectedLocation.lng], { icon: manualIcon })
          .bindPopup('<div class="text-xs font-bold font-sans p-1">Report Location Pin</div>');
        
        layerGroup.addLayer(pin);
        manualPinRef.current = pin;
      }
      bounds.push([selectedLocation.lat, selectedLocation.lng]);
    } else {
      if (manualPinRef.current) {
        layerGroup.removeLayer(manualPinRef.current);
        manualPinRef.current = null;
      }
    }

    // Fit bounds
    if (fitBounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }

  }, [markersString, hotspotsString, hotspotOverlayEnabled, selectedHotspotId, selectedLocation, fitBounds]);

  return (
    <div className="relative w-full h-full flex-1">
      <div ref={containerRef} className="w-full h-full bg-slate-950" />
      
      {/* Interactive Map Overlay Controls or Manual Location Indicator */}
      {onLocationSelect && (
        <div className="absolute top-2 right-2 z-[400] bg-slate-900/90 border border-slate-700/60 px-2.5 py-1 rounded text-[8px] font-mono text-amber-400 font-bold shadow-xl">
          👉 CLICK MAP TO SET MANUAL GPS
        </div>
      )}
    </div>
  );
}
