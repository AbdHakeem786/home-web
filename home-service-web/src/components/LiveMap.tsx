import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";

const workerIcon = L.divIcon({
  className: "",
  html:
    '<div style="width:34px;height:34px;border-radius:9999px;background:#6C3BFF;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(108,59,255,0.5);border:2px solid white;">' +
    '<div style="width:10px;height:10px;border-radius:9999px;background:white;"></div></div>',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

interface LiveMapProps {
  lat: number;
  lng: number;
}

export default function LiveMap({ lat, lng }: LiveMapProps) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      scrollWheelZoom={false}
      attributionControl={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={[lat, lng]} icon={workerIcon} />
      <Recenter lat={lat} lng={lng} />
    </MapContainer>
  );
}
