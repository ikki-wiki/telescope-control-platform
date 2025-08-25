import { useState, useEffect } from 'react';
import { 
  getFocuserSpeed, 
  getFocuserTimer, 
  setFocuserSpeed, 
  setFocuserTimer, 
  setFocuserMotion, 
  abortFocuserMotion 
} from '../api/telescopeAPI';
import { toast } from 'react-hot-toast';

export default function FocuserControl() {
  const [direction, setDirection] = useState('');
  const [speed, setSpeed] = useState('');
  const [timer, setTimer] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch current settings on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const speed = await getFocuserSpeed();
        const timer = await getFocuserTimer();
        if (speed !== undefined) {
          setSpeed(speed.speed); 
          toast.success('Focuser speed loaded')
        }
        if (timer !== undefined){
          setTimer(timer.timer);
          toast.success('Focuser movement duration loaded')
        } 
      } catch (err) {
        console.error('Failed to fetch focuser settings:', err);
        toast.error('Failed to fetch focuser settings');
      }
    };
    fetchData();
  }, []);
  
  const handleSpeedChange = (e) => setSpeed(e.target.value);
  const handleTimerChange = (e) => setTimer(e.target.value);
  const handleFocusMotionChange = (e) => setDirection(e.target.value);

  // Normal timed motion (tap mode)
  const handleFocusMotion = async () => {
    if (!direction || !speed || !timer) {
      toast.error('Please select direction, speed, and duration');
      return;
    }
    setIsLoading(true);
    const toastId = toast.loading('Moving focuser...');
    try {
      const speedResult = await setFocuserSpeed(parseFloat(speed));
      const timerResult = await setFocuserTimer(parseFloat(timer));
      const moveResult = await setFocuserMotion(direction);

      if (
        speedResult.status === 'success' && 
        timerResult.status === 'success' && 
        moveResult.status === 'success'
      ) {
        toast.success('Focuser motion started', { id: toastId });
      } else {
        throw new Error('Failed to set focuser motion');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to set focuser motion', { id: toastId });
    }
    setIsLoading(false);
  };

  // Abort helper
  const stopMotion = async () => {
    try {
      await abortFocuserMotion(true);
      await abortFocuserMotion(false); // reset abort property
      toast.success('Focuser stopped');
    } catch (err) {
      console.error('Failed to stop focuser:', err);
      toast.error('Failed to stop focuser');
    }
  };

  // Hold mode start
  const handleHoldStart = async () => {
    if (!direction || !speed) {
      toast.error('Please select direction and speed');
      return;
    }
    try {
      await setFocuserSpeed(speed);
      // Do NOT set timer → run continuously
      await setFocuserMotion(direction);
      toast.success('Focuser moving (hold mode)...');
    } catch (err) {
      console.error(err);
      toast.error('Failed to start focuser motion');
    }
  };

  return (
    <section className="w-full">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div>
          <label htmlFor="focus-direction" className="text-sm font-medium mb-1 block">
            Focus Direction
          </label>
          <select
            id="focus-direction"
            value={direction}
            onChange={handleFocusMotionChange}
            disabled={isLoading}
            className="w-full p-2 rounded-lg bg-gray-900 text-gray-100 border"
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
            onClick={stopMotion}
            className={`w-full mt-4 ${isLoading ? 'bg-gray-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'} text-white font-semibold rounded py-2 px-4 transition`}
          >
            Abort Motion
          </button>
        </div>
        <div>
          <button
            onClick={handleFocusMotion}           // Tap mode
            onMouseDown={handleHoldStart}         // Hold start
            onMouseUp={stopMotion}                // Stop on release
            disabled={isLoading}
            className={`w-full mt-4 ${isLoading ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white font-semibold rounded py-2 px-4 transition`}
          >
            {isLoading ? 'Moving focuser...' : 'Move Focuser'}
          </button>
        </div>
      </div>
    </section>
  );
}
