import { useState, useEffect } from 'react';
import { getFocuserSpeed, getFocuserTimer, setFocuserSpeed, setFocuserTimer, setFocuserMotion, abortFocuserMotion } from '../api/telescopeAPI';
import { toast } from 'react-hot-toast';

export default function FocuserControl() {
  const [direction, setDirection] = useState('');
  const [speed, setSpeed] = useState('');
  const [timer, setTimer] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // modal states
  const [showMoveConfirm, setShowMoveConfirm] = useState(false);
  const [showAbortConfirm, setShowAbortConfirm] = useState(false);

  // Fetch current settings on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const speed = await getFocuserSpeed();
        const timer = await getFocuserTimer();
        if (speed !== undefined) {
          setSpeed(speed);
        }
        if (timer !== undefined) {
          setTimer(timer);
        }
      } catch (err) {
        console.error('Failed to fetch current focuser settings:', err);
        toast.error('Failed to fetch current focuser settings');
      }
    };
    fetchData();
  }, []);
  
  const handleSpeedChange = (e) => setSpeed(e.target.value);
  const handleTimerChange = (e) => setTimer(e.target.value);
  const handleFocusMotionChange = (e) => setDirection(e.target.value);

  const handleFocusMotion = async () => {
    if (!direction || !speed || !timer) {
      toast.error('Please select direction, speed, and duration');
      return;
    }
    setIsLoading(true);
    const toastId = toast.loading('Moving focuser...');
    try {
      const speedResult = await setFocuserSpeed(speed);
      const timerResult = await setFocuserTimer(timer);
      const moveResult = await setFocuserMotion(direction);
      if (speedResult.status === 'success' && timerResult.status === 'success' && moveResult.status === 'success') {
        toast.success('Focuser motion started', { id: toastId });
      } else {
        throw new Error('Failed to set focuser motion');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to set focuser motion', { id: toastId });
    }
    setIsLoading(false);
    setShowMoveConfirm(false);
  };

  const handleAbortMotion = async () => {
    setIsLoading(true);
    const toastId = toast.loading('Aborting focuser motion...');
    try {
      const result = await abortFocuserMotion(true);
      if (result.status === 'success') {
        toast.success('Focuser motion aborted', { id: toastId });
        try {
          await abortFocuserMotion(false); // reset abort property
        } catch (err) {
          console.error('Failed to reset abort property:', err);
          toast.error('Failed to reset abort property');
        }
      } else {
        throw new Error('Failed to abort focuser motion');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to abort focuser motion', { id: toastId });
    }
    setIsLoading(false);
    setShowAbortConfirm(false);
  };

  return (
    <section className="w-full">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="focus-direction" className="text-sm font-medium mb-1 block">
            Focus Direction
          </label>
          <select
            id="focus-direction"
            value={direction}
            onChange={handleFocusMotionChange}
            disabled={isLoading}
            className="w-full p-2 rounded bg-gray-900 text-gray-100 border"
          >
            <option value="" disabled>Select direction</option>
            <option value="FOCUS_INWARD">Move Inwards</option>
            <option value="FOCUS_OUTWARD">Move Outwards</option>
          </select>
        </div>
        <div>
          <label htmlFor="speed" className="text-sm font-medium mb-1 block">Speed</label>
          <input
            type="number"
            id="speed"
            value={speed}
            onChange={handleSpeedChange}
            className="border rounded-lg px-3 py-2 text-sm w-full"
          />
        </div>
        <div>
          <label htmlFor="timer" className="text-sm font-medium mb-1 block">Duration (ms)</label>
          <input
            type="number"
            id="timer"
            value={timer}
            onChange={handleTimerChange}
            className="border rounded-lg px-3 py-2 text-sm w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <button
            onClick={() => setShowAbortConfirm(true)}
            disabled={isLoading}
            className={`w-full mt-4 ${isLoading ? 'bg-gray-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'} text-white font-semibold rounded py-2 px-4 transition`}
          >
            {isLoading ? 'Aborting...' : 'Abort Focuser Motion'}
          </button>
        </div>
        <div>
          <button
            onClick={() => setShowMoveConfirm(true)}
            disabled={isLoading}
            className={`w-full mt-4 ${isLoading ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white font-semibold rounded py-2 px-4 transition`}
          >
            {isLoading ? 'Moving focuser...' : 'Move Focuser'}
          </button>
        </div>
      </div>

      {/* Move Confirmation Modal */}
      {showMoveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="bg-gray-900 rounded-lg p-8 shadow-xl max-w-sm w-full">
            <h2 className="text-2xl font-semibold mb-6 text-white">Confirm Focuser Move</h2>
            <p className="mb-6 text-gray-300">
              Are you sure you want to move the focuser?<br />
              <strong>Direction:</strong> {direction}<br />
              <strong>Speed:</strong> {speed}<br />
              <strong>Duration:</strong> {timer} ms
            </p>
            <div className="flex justify-between gap-4">
              <button
                className="px-5 py-3 bg-red-800 rounded hover:bg-red-900 text-white font-semibold transition"
                onClick={() => setShowMoveConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="px-5 py-3 bg-blue-700 rounded hover:bg-blue-800 text-white font-semibold transition"
                onClick={handleFocusMotion}
                disabled={isLoading}
              >
                Yes, Move
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Abort Confirmation Modal */}
      {showAbortConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="bg-gray-900 rounded-lg p-8 shadow-xl max-w-sm w-full">
            <h2 className="text-2xl font-semibold mb-6 text-white">Confirm Abort</h2>
            <p className="mb-6 text-gray-300">
              Are you sure you want to abort the focuser motion?
            </p>
            <div className="flex justify-between gap-4">
              <button
                className="px-5 py-3 bg-red-800 rounded hover:bg-red-900 text-white font-semibold transition"
                onClick={() => setShowAbortConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="px-5 py-3 bg-blue-700 rounded hover:bg-blue-800 text-white font-semibold transition"
                onClick={handleAbortMotion}
                disabled={isLoading}
              >
                Yes, Abort
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
