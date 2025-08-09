import { useState, useEffect } from 'react';
import {
  getSiteInfo,
  setSiteInfo,
} from '../api/telescopeAPI';

export default function SiteInfoManager({ activeSiteId }) {
  const [currentInfo, setCurrentInfo] = useState(null);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [elevation, setElevation] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  /** Parse coordinate string or decimal into decimal degrees. */
  function parseCoordinate(input) {
    if (!input) return NaN;
    const trimmed = String(input).trim().toUpperCase();

    const directionMatch = trimmed.match(/[NSEW]$/);
    const direction = directionMatch ? directionMatch[0] : null;
    const withoutDir = trimmed.replace(/[NSEW]$/i, '').trim();

    const dmsRegex = /^(\d+(?:\.\d+)?)\D*(\d+(?:\.\d+)?)?\D*(\d+(?:\.\d+)?)?$/;
    const match = withoutDir.match(dmsRegex);

    let degrees;
    if (match) {
      const d = parseFloat(match[1]) || 0;
      const m = parseFloat(match[2]) || 0;
      const s = parseFloat(match[3]) || 0;
      degrees = d + m / 60 + s / 3600;
    } else {
      degrees = parseFloat(withoutDir);
    }
    if (isNaN(degrees)) return NaN;

    if (direction === 'S' || direction === 'W') {
      degrees *= -1;
    }
    return degrees;
  }

  /** Convert decimal degrees to DMS string (with rollover). */
  function decimalToDMS(decimal, isLatitude = true) {
    if (typeof decimal !== 'number' || isNaN(decimal)) return '';

    const absolute = Math.abs(decimal);
    let degrees = Math.floor(absolute);
    let minutesFloat = (absolute - degrees) * 60;
    let minutes = Math.floor(minutesFloat);
    let seconds = (minutesFloat - minutes) * 60;

    if (seconds >= 59.995) {
      seconds = 0;
      minutes += 1;
    }
    if (minutes >= 60) {
      minutes = 0;
      degrees += 1;
    }

    let direction = '';
    if (isLatitude) {
      direction = decimal >= 0 ? 'N' : 'S';
    } else {
      direction = decimal >= 0 ? 'E' : 'W';
    }

    return `${degrees}° ${minutes}' ${seconds.toFixed(2)}" ${direction}`;
  }

  /** Convert 0–360 East-positive longitude to signed -180..180 */
  function east360ToSigned(decimal, isLatitude = false) {
    if (typeof decimal !== 'number' || isNaN(decimal)) return NaN;

    if (isLatitude) {
      // Latitude is already -90..90 typically
      return decimal;
    } else {
      // Normalize to 0-360 first
      let lon = ((decimal % 360) + 360) % 360;
      if (lon > 180) lon -= 360; // Convert to -180..180
      return lon;
    }
  }

  useEffect(() => {
    const fetchSiteInfo = async () => {
      try {
        const data = await getSiteInfo();
        setCurrentInfo(data.site);
        setLatitude(data.site.latitude.toString());
        setLongitude(data.site.longitude.toString());
        setElevation(data.site.elevation.toString());
      } catch (err) {
        console.error('Failed to fetch site info', err);
      }
    };
    fetchSiteInfo();
    const interval = setInterval(fetchSiteInfo, 10000);
    return () => clearInterval(interval);
  }, [activeSiteId]);

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

      // Normalize longitude to [0, 360)
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
            <strong>Latitude:</strong>  
            <br />
            • East-positive (0–360 or signed): {currentInfo.latitude.toFixed(4)}  
            <br />
            • N/S format: {decimalToDMS(currentInfo.latitude, true)}
            <br />
            <strong>Longitude:</strong>  
            <br />
            • East-positive (INDI raw): {currentInfo.longitude.toFixed(4)}  
            <br />
            • Signed W/E format: {decimalToDMS(east360ToSigned(currentInfo.longitude, false), false)}
            <br />
            <strong>Elevation:</strong> {currentInfo.elevation.toFixed(2)} m
          </>
        ) : (
          'Loading...'
        )}
      </p>

      <div className="flex flex-col mb-4 w-full">
        <label htmlFor="latitude" className="text-sm font-medium mb-1">Latitude</label>
        <input
          type="text"
          id="latitude"
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
          placeholder={"e.g., 32.65 or 32° 39' N or 32 39 0 N"}
          className="border border-gray-300 rounded px-3 py-2 text-sm w-full"
        />
      </div>

      <div className="flex flex-col mb-4 w-full">
        <label htmlFor="longitude" className="text-sm font-medium mb-1">Longitude</label>
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
        <label htmlFor="elevation" className="text-sm font-medium mb-1">Elevation (meters)</label>
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
        className={`w-full ${isLoading ? 'bg-gray-500' : 'bg-blue-600 hover:bg-blue-700'} text-white font-semibold rounded py-2 px-4 transition`}
      >
        {isLoading ? 'Saving...' : 'Save Site Info'}
      </button>
    </section>
  );
}
