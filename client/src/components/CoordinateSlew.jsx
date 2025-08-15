import { useState, useRef } from 'react';
import CurrentTelescopePosition from './CurrentTelescopePosition';
import TrackingSwitch from './TrackingSwitch';
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
  const [errorMessage, setErrorMessage] = useState('');
  const [message, setMessage] = useState('');
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
    if (val.length >= maxLen && nextRef?.current) {
      nextRef.current.focus();
    }
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

  const formatRA = (decimalHours) => {
    const hours = Math.floor(decimalHours);
    const minutes = Math.floor((decimalHours - hours) * 60);
    const seconds = ((decimalHours - hours) * 60 - minutes) * 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toFixed(2).padStart(5, "0")}`;
  };

  const formatDEC = (decimalDegrees) => {
    const sign = decimalDegrees >= 0 ? "+" : "-";
    const absDeg = Math.abs(decimalDegrees);
    const degrees = Math.floor(absDeg);
    const minutes = Math.floor((absDeg - degrees) * 60);
    const seconds = ((absDeg - degrees) * 60 - minutes) * 60;
    return `${sign}${degrees.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toFixed(2).padStart(5, "0")}`;
  };

  const handleSlew = async () => {
    setShowSlewConfirm(false);
    setMessage('');
    setErrorMessage('');

    if (!validate()) return;

    const ra = `${pad(raH)}:${pad(raM)}:${pad(raS)}`;
    const dec = `${decSign}${pad(decD)}:${pad(decM)}:${pad(decS)}`;

    setIsSlewing(true);
    try {
      const result = await slewToCoordinates(ra, dec);
      if (result.status === 'success') {
          setMessage(result.message || 'Slew successful.');
          setErrorMessage('');
      } else {
          setErrorMessage(result.message || 'Slew failed.');
          setMessage('');
      }
    } catch (err) {
      setErrorMessage('Error while slewing: ' + (err.message || err.toString()));
    }
    setIsSlewing(false);
  };

  const handleSync = async () => {
    setShowSyncConfirm(false);
    setMessage('');
    setErrorMessage('');

    if (!validate()) return;

    const ra = `${pad(raH)}:${pad(raM)}:${pad(raS)}`;
    const dec = `${decSign}${pad(decD)}:${pad(decM)}:${pad(decS)}`;

    setIsSyncing(true);
    try {
      const result = await syncToCoordinates(ra, dec);
      if (result.status === 'success') {
        setMessage('Sync successful.');
      } else {
        setErrorMessage('Sync failed.');
      }
    } catch (err) {
      setErrorMessage('Error while syncing: ' + (err.message || err.toString()));
    }
    setIsSyncing(false);
  };

  const handleFillInCurrentPosition = async () => {
    try {
      const currentPosition = await getTelescopeCoordinates(); 
      const { ra, dec } = currentPosition;
      const raHMS = formatRA(ra);
      const decDMS = formatDEC(dec);
      parseAndSetRA(raHMS);
      parseAndSetDec(decDMS);
    } catch (error) {
      console.error('Error fetching current position:', error);
      setErrorMessage('Failed to fetch current position.');
    }
  }

  const handleResolveObject = async (objectName) => {
    try {
      const result = await resolveObject(objectName);
      if (result.status === 'success') {
        const { ra, dec } = result;
        const raHMS = formatRA(ra / 15);
        const decDMS = formatDEC(dec);
        parseAndSetRA(raHMS);
        parseAndSetDec(decDMS);
      } else {
        setErrorMessage(result.message || 'Failed to resolve object.');
      }
    } catch (error) {
      console.error('Error resolving object:', error);
      setErrorMessage('Failed to resolve object.');
    }
  };

  return (
    <section className="max-w-md">
      <CurrentTelescopePosition />
      {/*<TrackingSwitch />*/}

      {/* Resolve Object */}
        <input
          type="text"
          value={objectName}
          onChange={(e) => setObjectName(e.target.value)}
          placeholder="Enter object name (e.g. Vega, Jupiter, M42)"
          className="border border-gray-300 rounded px-3 py-2 mb-4 w-full"
        />

        <button
          onClick={() => handleResolveObject(objectName)}
          disabled={!objectName}
          className={`w-full py-2 rounded font-semibold text-white transition ${
            !objectName
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {'Get Coordinates'}
        </button>

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
          <span className="font-medium block mb-1">Declination (+/-DD:MM:SS.S)</span>
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

        <div className='grid grid-cols-2 gap-6'>
          {/* Fill in with current telescope RA/DEC */}
          <button
            type="button"
            onClick={handleFillInCurrentPosition}
            disabled={isSyncing || isSlewing}
            className={`w-full ${
              isSlewing ? 'bg-gray-500 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'
            } text-white font-semibold rounded py-2 transition flex items-center justify-center gap-2`}
          >
            {(
              <span className="" />
            )}
            {'Fill in with current telescope RA/DEC'}
          </button>

          {/* Sync Button */}
          <button
            type="button"
            onClick={() => setShowSyncConfirm(true)}
            disabled={isSlewing || isSyncing}
            className={`w-full ${
              isSyncing ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
            } text-white font-semibold rounded py-2 transition flex items-center justify-center gap-2`}
          >
            {isSyncing && (
              <span className="spinner-border animate-spin inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full" />
            )}
            {isSyncing ? 'Syncing...' : 'Sync to coordinates'}
          </button>
        </div> 
        
        {/* Slew Button */}
        <button
          type="button"
          onClick={() => setShowSlewConfirm(true)}
          disabled={isSyncing || isSlewing}
          className={`w-full ${
            isSlewing ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          } text-white font-semibold rounded py-2 transition flex items-center justify-center gap-2`}
        >
          {isSlewing && (
            <span className="spinner-border animate-spin inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full" />
          )}
          {isSlewing ? 'Slewing...' : 'Slew to coordinates'}
        </button>

        {errorMessage && (
          <div className="text-red-600 font-semibold mt-2">{errorMessage}</div>
        )}

        {message && (
          <div className="text-green-600 font-semibold mt-2">{message}</div>
        )}

        {/* Slew Confirmation Modal */}
        {showSlewConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded p-6 shadow-md text-white max-w-sm w-full">
              <h2 className="text-xl font-semibold mb-4">Confirm Slew</h2>
              <p className="mb-2">
                Are you sure you want to slew to:<br /></p>
              <p className="mb-6">
                <strong>RA:</strong> {raH}:{raM}:{raS}<br />
                <strong>DEC:</strong> {decSign}{decD}º {decM}' {decS}""
              </p>
              <div className="flex justify-between gap-3">
                <button
                  className="px-4 py-2 bg-red-800 rounded hover:bg-red-900"
                  onClick={() => setShowSlewConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800"
                  onClick={handleSlew}
                >
                  Yes, Slew
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sync Confirmation Modal */}
        {showSyncConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded p-6 shadow-md text-white max-w-sm w-full">
              <h2 className="text-lg font-bold mb-4">Confirm Sync</h2>
              <p className="mb-4">Are you sure you want to sync the telescope to these coordinates?</p>
              <p className="mb-6">
                <strong>RA:</strong> {raH}:{raM}:{raS}<br />
                <strong>DEC:</strong> {decSign}{decD}º {decM}' {decS}""
              </p>
              <div className="flex justify-between gap-3">
                <button
                  onClick={() => setShowSyncConfirm(false)}
                  className="px-4 py-2 bg-red-800 rounded hover:bg-red-900"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSync}
                  className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800"
                >
                  Yes, Sync
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}