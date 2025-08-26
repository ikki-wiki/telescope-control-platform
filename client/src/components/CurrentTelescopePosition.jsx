import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTelescopeCoordinates } from '../api/telescopeAPI';

export default function CurrentTelescopePosition() {
  const [currentRa, setCurrentRa] = useState('0');
  const [currentDec, setCurrentDec] = useState('0');
  const [currentAlt, setCurrentAlt] = useState(0);
  const [currentAz, setCurrentAz] = useState(0);

  const fetchCurrentPosition = async () => {
    try {
      const data = await getTelescopeCoordinates();
      setCurrentRa(data.position.ra);
      setCurrentDec(data.position.dec);
      setCurrentAlt(data.alt);
      setCurrentAz(data.az);
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
    return `${degrees}° ${minutes}' ${seconds}"`;
  };

  const formatAlt = (alt) => {
    const sign = alt > 0 ? '+' : alt < 0 ? '-' : '';
    return `${sign}${Math.abs(alt).toFixed(2)}°`;
  };

  const formatAz = (az) => {
    return `${az.toFixed(2)}°`;
  };

  useEffect(() => {
    fetchCurrentPosition();
    const interval = setInterval(fetchCurrentPosition, 1000);
    return () => clearInterval(interval);
  }, []);

  // Small animation props used repeatedly
  const animateProps = {
    initial: { opacity: 0, y: -5 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 5 },
    transition: { duration: 0.3 },
  };

  return (
    <div className="mb-4 p-3 rounded bg-gray-800 text-gray-100 shadow-sm ">
      <h3 className="font-medium mb-2">Current Telescope Position</h3>

      <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-base">
        {/* RA (top-left) */}
        <div>
          <span className="text-neutral-400">Right Ascension:</span>{' '}
          <AnimatePresence mode="wait">
            <motion.span key={currentRa} {...animateProps} className="font-mono">
              {rawRAtoHMS(currentRa)}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Azimuth (top-right) */}
        <div>
          <span className="text-neutral-400">Azimuth:</span>{' '}
          <AnimatePresence mode="wait">
            <motion.span key={currentAz} {...animateProps} className="font-mono">
              {formatAz(currentAz)}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Declination (bottom-left) */}
        <div>
          <span className="text-neutral-400">Declination:</span>{' '}
          <AnimatePresence mode="wait">
            <motion.span key={currentDec} {...animateProps} className="font-mono">
              {rawDECtoDMS(currentDec)}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Altitude (bottom-right) */}
        <div>
          <span className="text-neutral-400">Altitude:</span>{' '}
          <AnimatePresence mode="wait">
            <motion.span key={currentAlt} {...animateProps} className="font-mono">
              {formatAlt(currentAlt)}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
