import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTelescopeCoordinates, slewToCoordinates } from '../api/telescopeAPI'; 

export default function CoordinateSlew() {
  const [ra, setRa] = useState('');
  const [dec, setDec] = useState('');
  const [currentRa, setCurrentRa] = useState('00:00:00');
  const [currentDec, setCurrentDec] = useState('+00:00:00');
  const [isLoading, setIsLoading] = useState(false);

  const patternRA = /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;
  const patternDEC = /^[+-](0\d|[1-8]\d|90):[0-5]\d:[0-5]\d$/;

  const fetchCurrentPosition = async () => {
    try {
      const position = await getTelescopeCoordinates();
      setCurrentRa(position.ra);
      setCurrentDec(position.dec);
    } catch (error) {
      console.error('Error fetching current position:', error);
    }
  };

  useEffect(() => {
    fetchCurrentPosition();
    const interval = setInterval(fetchCurrentPosition, 5000);
    return () => clearInterval(interval);
  }, []);

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
      await fetchCurrentPosition(); // Refresh after slew
    } catch (err) {
      alert('Failed to slew: ' + err.message);
    }
    setIsLoading(false);
  };

  return (
    <section className="p-6 max-w-md">
      <h2 className="text-xl font-semibold mb-4">Slew to Coordinates</h2>

      {/* Current Position Display */}
      <div className="mb-4 p-3 rounded bg-gray-800 text-gray-100 shadow-sm">
        <h3 className="font-medium mb-2">Current Telescope Position:</h3>

        <div className="space-y-1">
          <div>
            <span className="text-neutral-400">RA:</span>{' '}
            <AnimatePresence mode="wait">
              <motion.span
                key={currentRa}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.3 }}
                className="font-mono"
              >
                {currentRa}
              </motion.span>
            </AnimatePresence>
          </div>
          <div>
            <span className="text-neutral-400">DEC:</span>{' '}
            <AnimatePresence mode="wait">
              <motion.span
                key={currentDec}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.3 }}
                className="font-mono"
              >
                {currentDec}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      </div>

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
