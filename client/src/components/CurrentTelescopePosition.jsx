import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTelescopeCoordinates } from '../api/telescopeAPI';

export default function CurrentTelescopePosition() {
  const [currentRa, setCurrentRa] = useState('00:00:00');
  const [currentDec, setCurrentDec] = useState('+00:00:00');

  const fetchCurrentPosition = async () => {
    try {
      const position = await getTelescopeCoordinates();
      setCurrentRa(position.ra);
      setCurrentDec(position.dec);
    } catch (error) {
      console.error('Error fetching current position:', error);
    }
  };

  const rawRAtoHMS = (rawRA) => {
    const totalSeconds = Math.floor(rawRA * 3600);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const rawDECtoDMS = (rawDec) => {
    const totalSeconds = Math.floor(rawDec * 3600);
    const degrees = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${degrees}º ${minutes}' ${seconds}"`;
  };

  useEffect(() => {
    fetchCurrentPosition();
    const interval = setInterval(fetchCurrentPosition, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mb-4 p-3 rounded bg-gray-800 text-gray-100 shadow-sm">
      <h3 className="font-medium mb-2">Current Telescope Position:</h3>

      <div className="space-y-1">
        <div>
          <span className="text-neutral-400">RA (HMS):</span>{' '}
          <AnimatePresence mode="wait">
            <motion.span
              key={currentRa}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.3 }}
              className="font-mono"
            >
              {rawRAtoHMS(currentRa)}
            </motion.span>
          </AnimatePresence>
        </div>
        <div>
          <span className="text-neutral-400">DEC (DMS):</span>{' '}
          <AnimatePresence mode="wait">
            <motion.span
              key={currentDec}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.3 }}
              className="font-mono"
            >
              {rawDECtoDMS(currentDec)}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
