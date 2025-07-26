import { useState } from 'react';
import { slewToObject, resolveObject, slewToCoordinates } from '../api/telescopeAPI';

export default function SlewToObject() {
  const [objectName, setObjectName] = useState('');
  const [coordinates, setCoordinates] = useState(null);
  const [loading, setLoading] = useState(false);
  const [slewing, setSlewing] = useState(false);
  const [error, setError] = useState('');

  function degToHms(ra) {
    const totalSeconds = ra / 15 * 3600;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = (totalSeconds % 60).toFixed(2);
    return `${hours}:${minutes}:${seconds}`;
  }

  function degToDms(dec) {
    const sign = dec >= 0 ? "+" : "-";
    const abs = Math.abs(dec);
    const degrees = Math.floor(abs);
    const minutes = Math.floor((abs - degrees) * 60);
    const seconds = ((abs - degrees - minutes / 60) * 3600).toFixed(2);
    return `${sign}${degrees}:${minutes}:${seconds}`;
  }

  const handleResolve = async () => {
    setLoading(true);
    setError('');
    setCoordinates(null);
    try {
      const data = await resolveObject(objectName);
      if (data.status === 'success' && typeof data.ra === 'number' && typeof data.dec === 'number') {
        setCoordinates({ ra: data.ra, dec: data.dec });
      } else {
        setError(data.message || 'Object not found or invalid coordinates');
      }
    } catch (err) {
      setError('Failed to resolve object');
    }
    setLoading(false);
  };

  const handleSlew = async () => {
    if (!coordinates) return;
    setSlewing(true);
    try {
      const raStr = degToHms(coordinates.ra);
      const decStr = degToDms(coordinates.dec);
      const data = await slewToCoordinates(raStr, decStr);
      //if (data.status === 'success') {
      //  setCoordinates({ ra: data.ra, dec: data.dec });
      //} else {
      //  setError(data.message || 'Failed to slew');
      //}
    } catch (err) {
      setError('Failed to slew');
    }
    setSlewing(false);
  };

  return (
    <div className="p-4 max-w-md">
      <h2 className="text-lg font-semibold mb-2">Slew to Celestial Object</h2>
      <input
        type="text"
        value={objectName}
        onChange={(e) => setObjectName(e.target.value)}
        placeholder="Enter object name (e.g. Vega, Jupiter, M42)"
        className="border px-3 py-2 rounded w-full mb-2"
      />
      <button
        onClick={handleResolve}
        disabled={loading || !objectName}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? 'Resolving...' : 'Get Coordinates'}
      </button>

      {error && <p className="text-red-500 mt-2">{error}</p>}

      {coordinates && (
        <div className="mt-4">
          <p>RA (deg): <strong>{typeof coordinates.ra === 'number' ? coordinates.ra.toFixed(4) : 'N/A'}°</strong></p>
          <p>Dec (deg): <strong>{typeof coordinates.dec === 'number' ? coordinates.dec.toFixed(4) : 'N/A'}°</strong></p>
          <p>RA (HMS): <strong>{degToHms(coordinates.ra)}</strong></p>
          <p>Dec (DMS): <strong>{degToDms(coordinates.dec)}</strong></p>
          <button
            onClick={handleSlew}
            disabled={slewing}
            className="mt-3 bg-green-600 text-white px-4 py-2 rounded"
          >
            {slewing ? 'Slewing...' : `Slew to ${objectName}`}
          </button>
        </div>
      )}
    </div>
  );
}
