import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import CurrentTelescopePosition from './CurrentTelescopePosition';
import ManualTelescopeMotionControl from './ManualTelescopeMotionControl';
import { getTelescopeCoordinates, slewToCoordinates, syncToCoordinates, resolveObject } from '../api/telescopeAPI';

export default function CoordinateSlew() {
  const [raH, setRaH] = useState('');
  const [raM, setRaM] = useState('');
  const [raS, setRaS] = useState('');
  const [decSign, setDecSign] = useState('+');
  const [decD, setDecD] = useState('');
  const [decM, setDecM] = useState('');
  const [decS, setDecS] = useState('');
  const [errors, setErrors] = useState({});
  const [isSlewing, setIsSlewing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSlewConfirm, setShowSlewConfirm] = useState(false);
  const [showSyncConfirm, setShowSyncConfirm] = useState(false);
  const [objectName, setObjectName] = useState('');

  const raMRef = useRef();
  const raSRef = useRef();
  const decDRef = useRef();
  const decMRef = useRef();
  const decSRef = useRef();

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
    if (Object.keys(errs).length > 0) toast.error('Invalid coordinate input');
    return Object.keys(errs).length === 0;
  };

  const pad = (val) => {
    if (!val) return '00';
    if (val.includes('.')) {
      const [intPart, decPart] = val.split('.');
      return intPart.padStart(2, '0') + '.' + decPart;
    }
    return val.padStart(2, '0');
  };

  const autoAdvance = (val, maxLen, nextRef) => {
    if (val.length >= maxLen && nextRef?.current) nextRef.current.focus();
  };

  const parseAndSetRA = (str) => {
    const parts = str.trim().split(':');
    if (parts.length >= 3) {
      setRaH(parts[0].replace(/\D/g, '').slice(0, 2));
      setRaM(parts[1].replace(/\D/g, '').slice(0, 2));
      setRaS(parts[2].match(/^\d+(\.\d+)?/)?.[0] || '');
      raMRef.current?.focus();
    }
  };

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

  const handleIntInput = (setter, maxLen, nextRef) => (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, maxLen);
    setter(val);
    autoAdvance(val, maxLen, nextRef);
  };

  const handleSecondsInput = (setter) => (e) => {
    let val = e.target.value;
    if (/^\d*\.?\d*$/.test(val)) {
      if (val.startsWith('.')) val = '0' + val;
      setter(val);
    }
  };

  const handleRaPaste = (e) => { e.preventDefault(); parseAndSetRA(e.clipboardData.getData('text')); };
  const handleDecPaste = (e) => { e.preventDefault(); parseAndSetDec(e.clipboardData.getData('text')); };

  const formatRA = (decimalHours) => {
    let hours = Math.floor(decimalHours);
    let minutes = Math.floor((decimalHours - hours) * 60);
    let seconds = ((decimalHours - hours) * 60 - minutes) * 60;

    if (seconds >= 59.995) { seconds = 0; minutes += 1; }
    if (minutes >= 60) { minutes = 0; hours += 1; }
    if (hours >= 24) { hours = 0; }

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toFixed(2).padStart(5, "0")}`;
  };

  const formatDEC = (decimalDegrees) => {
    const sign = decimalDegrees >= 0 ? "+" : "-";
    const absDeg = Math.abs(decimalDegrees);
    let degrees = Math.floor(absDeg);
    let minutes = Math.floor((absDeg - degrees) * 60);
    let seconds = ((absDeg - degrees) * 60 - minutes) * 60;

    if (seconds >= 59.995) { seconds = 0; minutes += 1; }
    if (minutes >= 60) { minutes = 0; degrees += 1; }
    if (degrees > 90) { degrees = 90; minutes = 0; seconds = 0; }

    return `${sign}${degrees.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toFixed(2).padStart(5, "0")}`;
  };

  const handleSlew = async () => {
    setShowSlewConfirm(false);
    if (!validate()) return;

    const ra = `${pad(raH)}:${pad(raM)}:${pad(raS)}`;
    const dec = `${decSign}${pad(decD)}:${pad(decM)}:${pad(decS)}`;

    setIsSlewing(true);
    const toastId = toast.loading('Slewing...');

    try {
      const result = await slewToCoordinates(ra, dec, objectName);
      if (result.status === 'success') {
        toast.success(result.message || 'Slew successful!', { id: toastId });
        setRaH('');
        setRaM('');
        setRaS('');
        setDecD('');
        setDecM('');
        setDecS('');
        setObjectName('');
      } else {
        toast.error(result.message || 'Slew failed!', { id: toastId });
      }
    } catch (err) {
      toast.error('Error while slewing: ' + (err.message || err.toString()), { id: toastId });
    }
    setIsSlewing(false);
  };

  const handleSync = async () => {
    setShowSyncConfirm(false);
    if (!validate()) return;

    const ra = `${pad(raH)}:${pad(raM)}:${pad(raS)}`;
    const dec = `${decSign}${pad(decD)}:${pad(decM)}:${pad(decS)}`;

    setIsSyncing(true);
    const toastId = toast.loading('Syncing...');

    try {
      const result = await syncToCoordinates(ra, dec);
      if (result.status === 'success') {
        toast.success('Sync successful!', { id: toastId });
      } else {
        toast.error('Sync failed!', { id: toastId });
      }
    } catch (err) {
      toast.error('Error while syncing: ' + (err.message || err.toString()), { id: toastId });
    }
    setIsSyncing(false);
  };

  const handleFillInCurrentPosition = async () => {
    try {
      const { position } = await getTelescopeCoordinates();
      parseAndSetRA(formatRA(position.ra));
      parseAndSetDec(formatDEC(position.dec));
      toast.success('Current telescope position loaded');
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch current position');
    }
  };

  const handleResolveObject = async (name) => {
    try {
      const result = await resolveObject(name);
      if (result.status === 'success') {
        parseAndSetRA(formatRA(result.ra / 15));
        parseAndSetDec(formatDEC(result.dec));
        toast.success('Object coordinates loaded');
      } else toast.error(result.message || 'Failed to resolve object');
    } catch (error) {
      console.error(error);
      toast.error('Failed to resolve object');
    }
  };

  const isInputComplete =
    raH.trim() !== '' &&
    raM.trim() !== '' &&
    raS.trim() !== '' &&
    decD.trim() !== '' &&
    decM.trim() !== '' &&
    decS.trim() !== '';

  return (
    <section className="max-w mx-auto">
      {/* 1. Current telescope status/position */}
      <CurrentTelescopePosition />
      
      {/* 2. Object lookup */}
      <div className="mt-4">
        <input
          type="text"
          value={objectName}
          onChange={(e) => setObjectName(e.target.value)}
          placeholder="Object name (e.g. Vega, Jupiter, M42)"
          className="border border-gray-300 rounded px-3 py-2 w-full"
        />
        <button
          onClick={() => handleResolveObject(objectName)}
          disabled={!objectName}
          className={`mt-2 w-full py-2 rounded font-semibold text-white transition ${
            !objectName
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >Load Object Coordinates</button>
      </div>

      {/* 3. Manual coordinate entry */}
      <fieldset className="mt-6 p-4 border rounded ">
        <legend className="font-semibold">Target Coordinates</legend>
        <div className="flex flex-col gap-4">
        {/* Right Ascension */}
        <div>
          <span className="font-medium block mb-1">Right Ascension (HH:MM:SS.SS)</span>
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={2}
              placeholder="HH"
              value={raH}
              onChange={handleIntInput(setRaH, 2, raMRef)}
              onPaste={handleRaPaste}
              className="w-full border rounded px-2 py-1"
              disabled={isSlewing || isSyncing}
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
              disabled={isSlewing || isSyncing}
            />
            <input
              type="text"
              placeholder="SS.S"
              value={raS}
              ref={raSRef}
              onChange={handleSecondsInput(setRaS)}
              onPaste={handleRaPaste}
              className="w-full border rounded px-2 py-1"
              disabled={isSlewing || isSyncing}
            />
          </div>
          <div className="text-sm text-red-500 mt-1">
            {errors.raH || errors.raM || errors.raS}
          </div>
        </div>

        {/* Declination */}
        <div>
          <span className="font-medium block mb-1">Declination (+/-DD° MM' SS.SS")</span>
          <div className="flex gap-2">
            <select
              value={decSign}
              onChange={(e) => setDecSign(e.target.value)}
              className="w-20 border rounded px-2 py-1 bg-gray-900 text-gray-100"
              disabled={isSlewing || isSyncing}
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
              disabled={isSlewing || isSyncing}
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
              disabled={isSlewing || isSyncing}
            />
            <input
              type="text"
              placeholder="SS.S"
              value={decS}
              ref={decSRef}
              onChange={handleSecondsInput(setDecS)}
              onPaste={handleDecPaste}
              className="w-full border rounded px-2 py-1"
              disabled={isSlewing || isSyncing}
            />
          </div>
          <div className="text-sm text-red-500 mt-1">
            {errors.decD || errors.decM || errors.decS}
          </div>
        </div>
        </div>
        {/* 4. Fill with current position */}
        <button
          type="button"
          onClick={handleFillInCurrentPosition}
          disabled={isSyncing || isSlewing}
          className='w-full mt-3 bg-teal-600 hover:bg-teal-700 text-white py-2 rounded font-semibold transition'
        >Fill with current telescope RA/DEC</button>
      </fieldset>

      {/* 5. Slew and Sync actions */}
      <div className='grid grid-cols-2 gap-4 mt-5 mb-8'>
        <button
          type="button"
          onClick={() => setShowSlewConfirm(true)}
          disabled={isSyncing || isSlewing || !isInputComplete}
          className={`w-full ${
            isSlewing || !isInputComplete ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          } text-white font-semibold rounded py-2 transition`}
        >{isSlewing ? 'Slewing...' : 'Slew to coordinates'}</button>
        <button
          type="button"
          onClick={() => setShowSyncConfirm(true)}
          disabled={isSlewing || isSyncing || !isInputComplete}
          className={`w-full ${
            isSyncing || !isInputComplete ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
          } text-white font-semibold rounded py-2 transition`}
        >{isSyncing ? 'Syncing...' : 'Sync to coordinates'}</button>
      </div>

        {/* Slew Confirmation Modal */}
      {showSlewConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="slew-modal-title"
          tabIndex={-1}
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 transition-opacity duration-300"
        >
          <div className="bg-gray-900 rounded-lg p-8 shadow-xl max-w-sm w-full transform transition-transform duration-300 scale-100">
            <h2
              id="slew-modal-title"
              className="text-2xl font-semibold mb-6 flex items-center gap-3 text-white select-none"
            >
              <svg
                className="w-7 h-7 text-blue-500 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 17v-6a4 4 0 014-4h3m5 10v6a4 4 0 01-4-4h-3"
                />
              </svg>
              Confirm Slew
            </h2>
            <p className="mb-8 text-gray-300 leading-relaxed text-base">
              Are you sure you want to slew to:<br />
              <strong>RA:</strong> {raH}:{raM}:{raS}<br />
              <strong>DEC:</strong> {decSign}{decD}° {decM}' {decS}""
            </p>
            <div className="flex justify-between gap-4">
              <button
                className="px-5 py-3 bg-red-800 rounded hover:bg-red-900 focus:outline-none focus:ring-4 focus:ring-red-700/60 text-white font-semibold transition"
                onClick={() => setShowSlewConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="px-5 py-3 bg-blue-700 rounded hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-600/60 text-white font-semibold transition"
                onClick={handleSlew}
                disabled={isSlewing}
              >
                Yes, Slew
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sync Confirmation Modal */}
      {showSyncConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="sync-modal-title"
          tabIndex={-1}
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 transition-opacity duration-300"
        >
          <div className="bg-gray-900 rounded-lg p-8 shadow-xl max-w-sm w-full transform transition-transform duration-300 scale-100">
            <h2
              id="sync-modal-title"
              className="text-2xl font-semibold mb-6 flex items-center gap-3 text-white select-none"
            >
              <svg
                className="w-7 h-7 text-green-500 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Confirm Sync
            </h2>
            <p className="mb-8 text-gray-300 leading-relaxed text-base">
              Are you sure you want to sync the telescope to these coordinates?<br />
              <strong>RA:</strong> {raH}:{raM}:{raS}<br />
              <strong>DEC:</strong> {decSign}{decD}° {decM}' {decS}""
            </p>
            <div className="flex justify-between gap-4">
              <button
                className="px-5 py-3 bg-red-800 rounded hover:bg-red-900 focus:outline-none focus:ring-4 focus:ring-red-700/60 text-white font-semibold transition"
                onClick={() => setShowSyncConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="px-5 py-3 bg-green-700 rounded hover:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-600/60 text-white font-semibold transition"
                onClick={handleSync}
                disabled={isSyncing}
              >
                Yes, Sync
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}