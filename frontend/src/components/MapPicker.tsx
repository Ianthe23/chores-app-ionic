import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Geolocation } from '@capacitor/geolocation';
import { IonButton, IonIcon, IonSpinner, IonText } from '@ionic/react';
import { locateOutline } from 'ionicons/icons';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapPickerProps {
  latitude?: number;
  longitude?: number;
  onLocationSelect: (lat: number, lng: number, locationName: string) => void;
}

// Component to handle map clicks
function LocationMarker({ position, setPosition }: any) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : <Marker position={position} />;
}

const MapPicker: React.FC<MapPickerProps> = ({ latitude, longitude, onLocationSelect }) => {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    latitude && longitude ? { lat: latitude, lng: longitude } : null
  );
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [error, setError] = useState<string>('');

  // Default to a reasonable center if no position provided (e.g., San Francisco)
  const defaultCenter: [number, number] = [37.7749, -122.4194];
  const mapCenter: [number, number] = position
    ? [position.lat, position.lng]
    : defaultCenter;

  const handleGetCurrentLocation = async () => {
    setIsGettingLocation(true);
    setError('');
    try {
      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });

      const newPosition = {
        lat: coordinates.coords.latitude,
        lng: coordinates.coords.longitude,
      };

      setPosition(newPosition);

      // Reverse geocode to get location name (simple approximation)
      const locationName = `${newPosition.lat.toFixed(4)}, ${newPosition.lng.toFixed(4)}`;
      onLocationSelect(newPosition.lat, newPosition.lng, locationName);
    } catch (err: any) {
      console.error('Error getting location:', err);
      setError(err.message || 'Failed to get current location');
    } finally {
      setIsGettingLocation(false);
    }
  };

  useEffect(() => {
    if (position) {
      const locationName = `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}`;
      onLocationSelect(position.lat, position.lng, locationName);
    }
  }, [position]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <IonButton
          expand="block"
          onClick={handleGetCurrentLocation}
          disabled={isGettingLocation}
          style={{ flex: 1 }}
        >
          {isGettingLocation ? (
            <IonSpinner name="crescent" />
          ) : (
            <>
              <IonIcon icon={locateOutline} slot="start" />
              Use Current Location
            </>
          )}
        </IonButton>
      </div>

      {error && (
        <IonText color="danger" style={{ fontSize: '0.875rem', marginBottom: '8px', display: 'block' }}>
          {error}
        </IonText>
      )}

      <IonText color="medium" style={{ fontSize: '0.875rem', marginBottom: '8px', display: 'block' }}>
        {position
          ? `Selected: ${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}`
          : 'Tap on the map to select a location'}
      </IonText>

      <div style={{ height: '400px', borderRadius: '12px', overflow: 'hidden' }}>
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          key={`${mapCenter[0]}-${mapCenter[1]}`}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={setPosition} />
        </MapContainer>
      </div>
    </div>
  );
};

export default MapPicker;
