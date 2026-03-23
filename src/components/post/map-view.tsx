"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom marker icon (avoids webpack issues with default leaflet icons)
const pinIcon = L.divIcon({
  html: `<div style="
    width:14px;height:14px;
    background:hsl(142 38% 28%);
    border:3px solid white;
    border-radius:50%;
    box-shadow:0 2px 6px rgba(0,0,0,.35);
  "></div>`,
  className: "",
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [map, lat, lng]);
  return null;
}

interface MapViewProps {
  lat: number;
  lng: number;
  zoom?: number;
  className?: string;
}

export default function MapView({
  lat,
  lng,
  zoom = 11,
  className = "",
}: MapViewProps) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={zoom}
      scrollWheelZoom={false}
      className={`z-0 rounded-lg ${className}`}
      style={{ height: "200px", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]} icon={pinIcon} />
      <RecenterMap lat={lat} lng={lng} />
    </MapContainer>
  );
}
