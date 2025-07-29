import { useState, useRef } from 'react';
import CurrentTelescopePosition from './CurrentTelescopePosition';
import TrackingSwitch from './TrackingSwitch';
import { slewToCoordinates } from '../api/telescopeAPI';

export default function CoordinateSlew() {
  const [raH, setRaH] = useState('');
  const [raM, setRaM] = useState('');
  const [raS, setRaS] = useState('');
  const [decSign, setDecSign] = useState('+');
  const [decD, setDecD] = useState('');
  const [decM, setDecM] = useState('');
  const [decS, setDecS] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const raMRef = useRef();
  const raSRef = useRef();
  const decDRef = useRef();
  const decMRef = useRef();
  const decSRef = useRef();

  // Validation function
  const validate = () => {
    const errs = {};
    const h = parseInt(raH, 10);
    const m = parseInt(raM, 10);
    const s = parseFloat(raS);
    const d = parseInt(decD, 10);
    const dm = parseInt(decM, 10);
    const ds = parseFloat(decS);

    if (isNaN(h) || h < 0 || h > 23) errs.raH = 'HH must be 0–23';
    if (isNaN(m) || m < 0 || m > 59) errs.raM = 'MM must be 0–59';
    if (isNaN(s) || s < 0 || s >= 60) errs.raS = 'SS must be 0–59.999';

    if (isNaN(d) || d < 0 || d > 90) errs.decD = 'DD must be 0–90';
    if (isNaN(dm) || dm < 0 || dm > 59) errs.decM = 'MM must be 0–59';
    if (isNaN(ds) || ds < 0 || ds >= 60) errs.decS = 'SS must be 0–59.999';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Pad with zero if needed; keep decimals intact
  const pad = (val) => {
    if (!val) return '00';
    if (val.includes('.')) {
      const [intPart, decPart] = val.split('.');
      return intPart.padStart(2, '0') + '.' + decPart;
    }
    return val.padStart(2, '0');
  };

  // Auto-advance focus to next input if max length reached
  const autoAdvance = (val, maxLen, nextRef) => {
    if (val.length >= maxLen && nextRef?.current) {
      nextRef.current.focus();
    }
  };

  // Parse RA string "HH:MM:SS.S" and set fields
  const parseAndSetRA = (str) => {
    const parts = str.trim().split(':');
    if (parts.length >= 3) {
      setRaH(parts[0].replace(/\D/g, '').slice(0, 2));
      setRaM(parts[1].replace(/\D/g, '').slice(0, 2));
      setRaS(parts[2].match(/^\d+(\.\d+)?/)?.[0] || '');
      raMRef.current?.focus();
    }
  };

  // Parse Dec string "+/-DD:MM:SS.S" and set fields
  const parseAndSetDec = (str) => {
    let s = str.trim();
    if (s.startsWith('+') || s.startsWith('-')) {
      setDecSign(s[0]);
      s = s.slice(1);
    } else {
      setDecSign('+');
    }
    const parts = s.split(':');
    if (parts.length >= 3) {
      setDecD(parts[0].replace(/\D/g, '').slice(0, 2));
      setDecM(parts[1].replace(/\D/g, '').slice(0, 2));
      setDecS(parts[2].match(/^\d+(\.\d+)?/)?.[0] || '');
      decMRef.current?.focus();
    }
  };

  // Handlers for numeric inputs (integers)
  const handleIntInput = (setter, maxLen, nextRef) => (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, maxLen);
    setter(val);
    autoAdvance(val, maxLen, nextRef);
  };

  // Handlers for seconds input (floats allowed)
  const handleSecondsInput = (setter) => (e) => {
    let val = e.target.value;
    // Allow only digits and one dot
    if (/^\d*\.?\d*$/.test(val)) {
      // Auto prepend 0 if starts with dot like ".3"
      if (val.startsWith('.')) val = '0' + val;
      setter(val);
    }
  };

  // Paste handlers for RA and Dec inputs
  const handleRaPaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text');
    if (paste.includes(':')) {
      parseAndSetRA(paste);
    }
  };

  const handleDecPaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text');
    if (paste.includes(':')) {
      parseAndSetDec(paste);
    }
  };

  // Submit handler
  const handleSubmit = async () => {
    if (!validate()) return;

    const ra = `${pad(raH)}:${pad(raM)}:${pad(raS)}`;
    const dec = `${decSign}${pad(decD)}:${pad(decM)}:${pad(decS)}`;

    setIsLoading(true);
    try {
      await slewToCoordinates(ra, dec);
    } catch (err) {
      alert('Failed to slew: ' + err.message);
    }
    setIsLoading(false);
  };

  return (
    <section className="max-w-md">
      <CurrentTelescopePosition />
      <TrackingSwitch />

      <div className="flex flex-col gap-4 mt-4">
        {/* Right Ascension */}
        <div>
          <span className="font-medium block mb-1">Right Ascension (HH:MM:SS.S)</span>
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={2}
              placeholder="HH"
              value={raH}
              onChange={handleIntInput(setRaH, 2, raMRef)}
              onPaste={handleRaPaste}
              className="w-full border rounded px-2 py-1"
              disabled={isLoading}
            />
            <input
              type="text"
              maxLength={2}
              placeholder="MM"
              value={raM}
              ref={raMRef}
              onChange={handleIntInput(setRaM, 2, raSRef)}
              onPaste={handleRaPaste}
              className="w-full border rounded px-2 py-1"
              disabled={isLoading}
            />
            <input
              type="text"
              placeholder="SS.S"
              value={raS}
              ref={raSRef}
              onChange={handleSecondsInput(setRaS)}
              onPaste={handleRaPaste}
              className="w-full border rounded px-2 py-1"
              disabled={isLoading}
            />
          </div>
          <div className="text-sm text-red-500 mt-1">
            {errors.raH || errors.raM || errors.raS}
          </div>
        </div>

        {/* Declination */}
        <div>
          <span className="font-medium block mb-1">Declination (+/-DD:MM:SS.S)</span>
          <div className="flex gap-2">
            <select
              value={decSign}
              onChange={(e) => setDecSign(e.target.value)}
              className="w-20 border rounded px-2 py-1 bg-gray-900 text-gray-100"
              disabled={isLoading}
            >
              <option value="+">+</option>
              <option value="-">−</option>
            </select>
            <input
              type="text"
              maxLength={2}
              placeholder="DD"
              value={decD}
              ref={decDRef}
              onChange={handleIntInput(setDecD, 2, decMRef)}
              onPaste={handleDecPaste}
              className="w-full border rounded px-2 py-1"
              disabled={isLoading}
            />
            <input
              type="text"
              maxLength={2}
              placeholder="MM"
              value={decM}
              ref={decMRef}
              onChange={handleIntInput(setDecM, 2, decSRef)}
              onPaste={handleDecPaste}
              className="w-full border rounded px-2 py-1"
              disabled={isLoading}
            />
            <input
              type="text"
              placeholder="SS.S"
              value={decS}
              ref={decSRef}
              onChange={handleSecondsInput(setDecS)}
              onPaste={handleDecPaste}
              className="w-full border rounded px-2 py-1"
              disabled={isLoading}
            />
          </div>
          <div className="text-sm text-red-500 mt-1">
            {errors.decD || errors.decM || errors.decS}
          </div>
        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className={`w-full ${
            isLoading ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          } text-white font-semibold rounded py-2 transition flex items-center justify-center gap-2`}
        >
          {isLoading && (
            <span
              className="spinner-border animate-spin inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full"
              role="status"
              aria-label="loading"
            />
          )}
          {isLoading ? 'Sending...' : 'Slew to coordinates'}
        </button>
      </div>
    </section>
  );
}
