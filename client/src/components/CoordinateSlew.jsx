import { useState } from 'react';
import CurrentTelescopePosition from './CurrentTelescopePosition'; // import the new component
import { slewToCoordinates } from '../api/telescopeAPI'; 
import TrackingSwitch from './TrackingSwitch';

export default function CoordinateSlew() {
  const [ra, setRa] = useState('');
  const [dec, setDec] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const patternRA = /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;
  const patternDEC = /^[+-](0\d|[1-8]\d|90):[0-5]\d:[0-5]\d$/;

  const handleSubmit = async () => {
    if (!ra || !dec) {
      alert('Please enter both RA and Dec.');
      return;
    }

    if (!patternRA.test(ra)) {
      alert('Invalid RA format. Please use HH:MM:SS with HH=00-23, MM=00-59, SS=00-59.');
      return;
    }

    if (!patternDEC.test(dec)) {
      alert('Invalid Dec format. Please use +DD:MM:SS or -DD:MM:SS with DD=00-90, MM=00-59, SS=00-59.');
      return;
    }

    setIsLoading(true);
    try {
      await slewToCoordinates(ra, dec);
    } catch (err) {
      alert('Failed to slew: ' + err.message);
    }
    setIsLoading(false);
  };

  return (
    <section className="p-6 max-w-md">

      {/* Current Position Display */}
      <CurrentTelescopePosition />
      <TrackingSwitch />

      {/* Slew Input */}
      <div className="flex flex-col gap-4">
        <label className="flex flex-col">
          <span className="mb-1 font-medium">Right Ascension (HH:MM:SS)</span>
          <input
            type="text"
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="e.g. 05:34:31"
            value={ra}
            onChange={(e) => setRa(e.target.value)}
            disabled={isLoading}
          />
        </label>

        <label className="flex flex-col">
          <span className="mb-1 font-medium">Declination (+/-DD:MM:SS)</span>
          <input
            type="text"
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="e.g. +22:00:52"
            value={dec}
            onChange={(e) => setDec(e.target.value)}
            disabled={isLoading}
          />
        </label>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className={`${
            isLoading ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
          } text-white font-semibold rounded py-2 transition flex items-center justify-center gap-2`}
        >
          {isLoading && (
            <span
              className="spinner-border animate-spin inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full"
              role="status"
              aria-label="loading"
            ></span>
          )}
          {isLoading ? 'Sending...' : 'Slew to coordinates'}
        </button>
      </div>
    </section>
  );
}
