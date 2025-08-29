import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTelescopeCoordinates } from '../api/telescopeAPI';
import TooltipWrapper from './TooltipWrapper';

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
      <h3 className="font-medium mb-2">Current Telescope Coordinates</h3>

      <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-base">
        {/* RA (top-left) */}
        <TooltipWrapper content="Astronomical coordinate that measures an object's position eastward along the celestial equator. Expressed in hours, minutes, and seconds.">
          <div>
            <span className="text-neutral-400">Right Ascension:</span>{' '}
            <AnimatePresence mode="wait">
              <motion.span key={currentRa} {...animateProps} className="font-mono">
                {rawRAtoHMS(currentRa)}
              </motion.span>
            </AnimatePresence>
          </div>
        </TooltipWrapper>

        {/* Azimuth (top-right) */}
        <TooltipWrapper content="The compass direction from which the object is observed. Measured in degrees from North (0°) clockwise through East (90°), South (180°), and West (270°).">
          <div>
            <span className="text-neutral-400">Azimuth:</span>{' '}
            <AnimatePresence mode="wait">
              <motion.span key={currentAz} {...animateProps} className="font-mono">
                {formatAz(currentAz)}
              </motion.span>
            </AnimatePresence>
          </div>
        </TooltipWrapper>
        {/* Declination (bottom-left) */}
        <TooltipWrapper content="Astronomical coordinate that specifies an object's position north or south of the celestial equator. Expressed in degrees, arcminutes, and arcseconds.">
          <div>
            <span className="text-neutral-400">Declination:</span>{' '}
            <AnimatePresence mode="wait">
              <motion.span key={currentDec} {...animateProps} className="font-mono">
                {rawDECtoDMS(currentDec)}
              </motion.span>
            </AnimatePresence>
          </div>
        </TooltipWrapper>

        {/* Altitude (bottom-right) */}
        <TooltipWrapper content="The angle between the object and the observer's local horizon. Positive values indicate the object is above the horizon, while negative values indicate it is below. Expressed in degrees.">
          <div>
            <span className="text-neutral-400">Altitude:</span>{' '}
            <AnimatePresence mode="wait">
              <motion.span key={currentAlt} {...animateProps} className="font-mono">
                {formatAlt(currentAlt)}
              </motion.span>
            </AnimatePresence>
          </div>
        </TooltipWrapper>
      </div>
    </div>
  );
}
