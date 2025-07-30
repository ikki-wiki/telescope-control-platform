import { useState } from 'react';
import { slewToObject, resolveObject, slewToCoordinates } from '../api/telescopeAPI';

export default function SlewToObject() {
  const [objectName, setObjectName] = useState('');
  const [coordinates, setCoordinates] = useState(null);
  const [loading, setLoading] = useState(false);
  const [slewing, setSlewing] = useState(false);
  const [error, setError] = useState('');

  function degToHms(ra) {
    const totalSeconds = (ra / 15) * 3600;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = (totalSeconds % 60).toFixed(2);
    return `${hours}:${minutes}:${seconds}`;
  }

  function degToDms(dec) {
    const sign = dec >= 0 ? '+' : '-';
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
    } catch {
      setError('Failed to resolve object');
    }
    setLoading(false);
  };

  const handleSlew = async () => {
    if (!coordinates) return;
    setSlewing(true);
    setError('');
    try {
      const raStr = degToHms(coordinates.ra);
      const decStr = degToDms(coordinates.dec);
      await slewToCoordinates(raStr, decStr);
    } catch {
      setError('Failed to slew');
    }
    setSlewing(false);
  };

  return (
    <div className="max-w-md rounded-lg shadow-sm space-y-4">
      <input
        type="text"
        value={objectName}
        onChange={(e) => setObjectName(e.target.value)}
        placeholder="Enter object name (e.g. Vega, Jupiter, M42)"
        className="border border-gray-300 rounded px-3 py-2 w-full"
      />

      <button
        onClick={handleResolve}
        disabled={loading || !objectName}
        className={`w-full py-2 rounded font-semibold text-white transition ${
          loading || !objectName
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {loading ? 'Resolving...' : 'Get Coordinates'}
      </button>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
          {error}
        </div>
      )}

      {coordinates && (
        <div className="border border-gray-300 rounded p-4 space-y-2">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <p>
              RA (deg): <strong>{coordinates.ra.toFixed(4)}°</strong>
            </p>
            <p>
              Dec (deg): <strong>{coordinates.dec.toFixed(4)}°</strong>
            </p>
            <p>
              RA (HMS): <strong>{degToHms(coordinates.ra)}</strong>
            </p>
            <p>
              Dec (DMS): <strong>{degToDms(coordinates.dec)}</strong>
            </p>
          </div>
          
          <button
            onClick={handleSlew}
            disabled={slewing}
            className={`w-full mt-3 py-2 rounded font-semibold text-white transition ${
              slewing ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-green-700'
            }`}
          >
            {slewing ? 'Slewing...' : `Slew to ${objectName}`}
          </button>
        </div>
      )}
    </div>
  );
}
