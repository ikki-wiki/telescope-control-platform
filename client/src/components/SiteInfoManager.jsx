import { useState, useEffect } from 'react';
import {
  getSiteInfo,
  setSiteInfo,
} from '../api/telescopeAPI';

export default function SiteInfoManager() {
  const [currentInfo, setCurrentInfo] = useState(null);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [elevation, setElevation] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  function parseCoordinate(input) {
    if (!input) return NaN;

    const trimmed = input.trim().toUpperCase();
    const directionMatch = trimmed.match(/[NSEW]$/);
    const direction = directionMatch ? directionMatch[0] : null;
    const withoutDirection = trimmed.replace(/[NSEW]/g, '').trim();

    // Match DMS: degrees, optional minutes, optional seconds
    const dmsRegex = /(\d+(?:\.\d+)?)°?\s*(\d+(?:\.\d+)?)?'?\s*(\d+(?:\.\d+)?)?"?/;
    const match = withoutDirection.match(dmsRegex);

    let degrees = 0;

    if (match) {
      const d = parseFloat(match[1]) || 0;
      const m = parseFloat(match[2]) || 0;
      const s = parseFloat(match[3]) || 0;
      degrees = d + m / 60 + s / 3600;
    } else {
      degrees = parseFloat(withoutDirection);
      if (isNaN(degrees)) return NaN;
    }

    // Apply sign based on direction
    if (direction === 'S' || direction === 'W') {
      degrees *= -1;
    }

    return degrees;
  }

  function decimalToDMS(decimal, isLatitude = true) {
    if (typeof decimal !== 'number' || isNaN(decimal)) return '';

    const absolute = Math.abs(decimal);
    const degrees = Math.floor(absolute);
    const minutesFloat = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesFloat);
    const seconds = ((minutesFloat - minutes) * 60).toFixed(2);

    let direction = '';
    if (isLatitude) {
      direction = decimal >= 0 ? 'N' : 'S';
    } else {
      direction = decimal >= 0 ? 'E' : 'W';
    }

    return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
  }

  useEffect(() => {
    const fetchSiteInfo = async () => {
      try {
        const data = await getSiteInfo();
        setCurrentInfo(data.site);
      } catch (err) {
        console.error('Failed to fetch site info', err);
      }
    };

    fetchSiteInfo();
    const interval = setInterval(fetchSiteInfo, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      let parsedLat = parseCoordinate(latitude);
      let parsedLon = parseCoordinate(longitude);
      const parsedElev = parseFloat(elevation);

      if (isNaN(parsedLat) || isNaN(parsedLon) || isNaN(parsedElev)) {
        alert('Invalid coordinate or elevation');
        setIsLoading(false);
        return;
      }

      // Normalize longitude to 0–360 range
      if (parsedLon < 0) {
        parsedLon = 360 + parsedLon;
      }

      await setSiteInfo({
        latitude: parsedLat,
        longitude: parsedLon,
        elevation: parsedElev,
      });

      setLatitude('');
      setLongitude('');
      setElevation('');
      const updatedInfo = await getSiteInfo();
      setCurrentInfo(updatedInfo.site);
    } catch (err) {
      alert('Failed to update site info');
      console.error(err);
    }
    setIsLoading(false);
  };

  return (
    <section className="w-full">
      <p className="mb-4">
        {currentInfo ? (
          <>
            Latitude: <strong>{currentInfo.latitude.toFixed(8)}</strong> ({decimalToDMS(currentInfo.latitude, true)})<br />
            Longitude: <strong>{currentInfo.longitude.toFixed(8)}</strong> ({decimalToDMS(currentInfo.longitude, false)})<br />
            Elevation: <strong>{currentInfo.elevation.toFixed(2)}</strong> m
          </>
        ) : (
          'Loading...'
        )}
      </p>

      <div className="flex flex-col mb-4 w-full">
        <label htmlFor="latitude" className="text-sm font-medium mb-1">
          Latitude
        </label>
        <input
          type="text"
          id="latitude"
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
          placeholder={"e.g., 32.65 or 32° 39' N"}
          className="border border-gray-300 rounded px-3 py-2 text-sm w-full"
        />
      </div>

      <div className="flex flex-col mb-4 w-full">
        <label htmlFor="longitude" className="text-sm font-medium mb-1">
          Longitude
        </label>
        <input
          type="text"
          id="longitude"
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
          placeholder={"e.g., -16.91 or 16° 55' W"}
          className="border border-gray-300 rounded px-3 py-2 text-sm w-full"
        />
      </div>

      <div className="flex flex-col mb-4 w-full">
        <label htmlFor="elevation" className="text-sm font-medium mb-1">
          Elevation (meters)
        </label>
        <input
          type="number"
          id="elevation"
          value={elevation}
          onChange={(e) => setElevation(e.target.value)}
          placeholder={"e.g., 0"}
          className="border border-gray-300 rounded px-3 py-2 text-sm w-full"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={isLoading}
        className={`w-full ${
          isLoading ? 'bg-gray-500' : 'bg-blue-600 hover:bg-blue-700'
        } text-white font-semibold rounded py-2 px-4 transition`}
      >
        {isLoading ? 'Updating...' : 'Update Site Info'}
      </button>
    </section>
  );
}
