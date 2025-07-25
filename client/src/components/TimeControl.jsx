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
    return () => {clearInterval(utc_interval); clearInterval(time_interval);};
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
        Real current UTC time: <strong>{currentUTC}</strong>
      </p>
      <p>
        Current telescope time: <strong>{currentTime || 'Loading...'}</strong>
      </p>
      <p>
        Current UTC offset: <strong>{offset < 0 ? '-' + offset : '+' + offset}</strong>
      </p>

      {/* Time input */}
      <input
        type="time"
        step="1"
        value={newTime}
        onChange={(e) => setNewTime(e.target.value)}
        className="border border-gray-300 rounded px-3 py-2 my-2"
      />

      {/* Offset selector */}
      <label className="block mt-2 mb-1 font-medium">UTC Offset</label>
      <select
        value={newOffset}
        onChange={(e) => setNewOffset(e.target.value)}
        className="border border-gray-300 rounded px-3 py-2 my-2"
      >
        {offsetOptions.map((opt) => (
          <option key={opt} value={opt} className='bg-gray-900 text-gray-100'>
            {opt.startsWith('-') ? opt : '+' + opt}
          </option>
        ))}
      </select>

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
