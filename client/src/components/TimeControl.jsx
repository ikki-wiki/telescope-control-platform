import { useState, useEffect, useRef } from 'react';
import { getTime, setTime } from '../api/telescopeAPI';

export default function TimeControl() {
  const [currentUTC, setCurrentUTC] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [newTime, setNewTime] = useState('');
  const [offset, setOffset] = useState('');
  const [newOffset, setNewOffset] = useState('0');
  const [isLoading, setIsLoading] = useState(false);

  const telescopeDate = useRef(null);

  // Formats a Date object to HH:mm:ss
  const formatTime = (date) =>
    date.toISOString().split('T')[1].split('.')[0];

  // Update simulated ticking time
  useEffect(() => {
    const tick = setInterval(() => {
      if (telescopeDate.current) {
        telescopeDate.current.setSeconds(
          telescopeDate.current.getSeconds() + 1
        );
        setCurrentTime(formatTime(telescopeDate.current));
      }
    }, 1000);

    return () => clearInterval(tick);
  }, []);

  // Initial fetch of time and offset
  useEffect(() => {
    const fetchTime = async () => {
      try {
        const info = await getTime();
        if (info.time) {
          const [h, m, s] = info.time.split(':').map(Number);
          const now = new Date();
          telescopeDate.current = new Date(
            Date.UTC(
              now.getUTCFullYear(),
              now.getUTCMonth(),
              now.getUTCDate(),
              h,
              m,
              s
            )
          );
          setCurrentTime(formatTime(telescopeDate.current));
        }
        if (info.offset !== undefined) {
          setOffset(info.offset);
          setNewOffset(info.offset);
        }
      } catch (err) {
        console.error('Failed to fetch time', err);
      }
    };

    const updateUTCTime = () => {
      const now = new Date();
      const utc = now.toISOString().split('T')[1].split('.')[0];
      setCurrentUTC(utc);
    };

    updateUTCTime();
    fetchTime();

    const utc_interval = setInterval(updateUTCTime, 1000);
    return () => clearInterval(utc_interval);
  }, []);

  const handleSubmit = async () => {
    if (!newTime) {
      alert('Please select a time');
      return;
    }
    setIsLoading(true);
    try {
      await setTime(newTime, parseFloat(newOffset).toFixed(2));

      const [h, m, s] = newTime.split(':').map(Number);
      const now = new Date();
      telescopeDate.current = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
          h,
          m,
          s
        )
      );
      setCurrentTime(formatTime(telescopeDate.current));
      setNewTime('');
      setOffset(parseFloat(newOffset).toFixed(2));
      setNewOffset(parseFloat(newOffset).toFixed(2));
    } catch (error) {
      alert('Failed to set time');
    }
    setIsLoading(false);
  };

  // UTC offset options from -14.00 to +14.00 in 0.25 steps
  const offsetOptions = Array.from({ length: 113 }, (_, i) => (i * 0.25 - 14).toFixed(2));

  return (
    <section className="w-full">
      <p>
        Current telescope time: <strong>{currentTime || 'Loading...'}</strong>{' '}
        {offset !== '' && <strong>{offset > 0 ? `+${offset}` : offset}</strong>}
      </p>

      <div className="flex flex-col gap-4 mt-4 sm:flex-row">
        <div className="flex flex-col w-full">
          <label htmlFor="utc-time" className="text-sm font-medium mb-1">
            UTC Time
          </label>
          <input
            type="time"
            step={1}
            id="utc-time"
            className="border rounded-lg px-3 py-2 text-sm w-full"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
          />
        </div>

        <div className="flex flex-col w-full">
          <label htmlFor="utc-offset" className="text-sm font-medium mb-1">
            UTC Offset
          </label>
          <select
            id="utc-offset"
            className="border rounded-lg px-3 py-2 text-sm w-full"
            value={newOffset}
            onChange={(e) => setNewOffset(e.target.value)}
          >
            {offsetOptions.map((offset) => (
              <option key={offset} value={offset} className="bg-gray-900 text-gray-100">
                {offset >= 0 ? `+${offset}` : offset}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={isLoading}
        className={`w-full mt-4 ${
          isLoading ? 'bg-gray-500' : 'bg-blue-600 hover:bg-blue-700'
        } text-white font-semibold rounded py-2 px-4 transition`}
      >
        {isLoading ? 'Setting...' : 'Set Time'}
      </button>
    </section>
  );
}
