import { useState, useEffect } from 'react';
import { getTime, setTime } from '../api/telescopeAPI';

export default function TimeControl() {
  const [currentUTC, setCurrentUTC] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [newTime, setNewTime] = useState('');
  const [offset, setOffset] = useState('');
  const [newOffset, setNewOffset] = useState('0');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchTime = async () => {
      try {
        const info = await getTime();
        setCurrentTime(info.time);
        if (info.offset !== undefined) {
          setOffset(info.offset.toString());
        }
      } catch (err) {
        console.error('Failed to fetch time', err);
      }
    };

    const updateUTCTime = () => {
      const now = new Date();
      const utc = now.toISOString().split('T')[1].split('.')[0]; // Extract "HH:MM:SS"
      setCurrentUTC(utc);
    };

    updateUTCTime();
    fetchTime();
    const utc_interval = setInterval(updateUTCTime, 1000);
    const time_interval = setInterval(fetchTime, 5000);
    return () => {
      clearInterval(utc_interval);
      clearInterval(time_interval);
    };
  }, []);

  const handleSubmit = async () => {
    if (!newTime) {
      alert('Please select a time');
      return;
    }
    setIsLoading(true);
    try {
      await setTime(newTime, newOffset);
      setCurrentTime(newTime);
      setNewTime('');
      setOffset(newOffset);
      setNewOffset(newOffset);
    } catch (error) {
      alert('Failed to set time');
    }
    setIsLoading(false);
  };

  const offsetOptions = Array.from({ length: 29 }, (_, i) => (i - 14).toString());

  return (
    <section className="p-6 max-w-md">
      <h2 className="text-xl font-semibold mb-4">Set Telescope Time</h2>
      <p>
        Current UTC time: <strong>{currentUTC}</strong>
      </p>
      <p>
        Current telescope time: <strong>{currentTime || 'Loading...'}</strong>
      </p>
      <p>
        Current UTC offset: <strong>{offset > 0 ? '+' + offset : offset}</strong>
      </p>
      {/* Inputs side by side */}
      <div className="flex gap-4 mt-4">
        <div className="flex flex-col">
          <label htmlFor="utc-time" className="text-sm font-medium mb-1">
            UTC Time
          </label>
          <input
            type="time"
            step={1}
            id="utc-time"
            className="border rounded-lg px-3 py-2 text-sm w-40"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="utc-offset" className="text-sm font-medium mb-1">
            UTC Offset
          </label>
          <select
            id="utc-offset"
            className="border rounded-lg px-3 py-2 text-sm w-40"
            value={newOffset}
            onChange={(e) => setNewOffset(e.target.value)}
          >
            {offsetOptions.map((offset) => (
              <option key={offset} value={offset} className='bg-gray-900 text-gray-100'>
                {offset >= 0 ? `+${offset}` : offset}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={isLoading}
        className={`mt-4 ${
          isLoading ? 'bg-gray-500' : 'bg-blue-600 hover:bg-blue-700'
        } text-white font-semibold rounded py-2 px-4 transition`}
      >
        {isLoading ? 'Setting...' : 'Set Time'}
      </button>
    </section>
  );
}
