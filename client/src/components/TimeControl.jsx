import { useState, useEffect } from 'react';
import { getTime, setTime } from '../api/telescopeAPI';

export default function TimeControl() {
  const [currentTime, setCurrentTime] = useState('');
  const [newTime, setNewTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchTime = async () => {
      try {
        const info = await getTime();
        setCurrentTime(info.time);
      } catch (err) {
        console.error('Failed to fetch time', err);
      }
    };
    fetchTime();
    const interval = setInterval(fetchTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async () => {
    if (!newTime) {
      alert('Please select a time');
      return;
    }
    setIsLoading(true);
    try {
      await setTime(newTime);
      setCurrentTime(newTime);
      setNewTime('');
    } catch (error) {
      alert('Failed to set time');
    }
    setIsLoading(false);
  };

  return (
    <section className="p-6 max-w-md">
      <h2 className="text-xl font-semibold mb-4">Set Telescope Time</h2>
      <p>Current telescope time: <strong>{currentTime || 'Loading...'}</strong></p>
      <input
        type="time"
        value={newTime}
        onChange={e => setNewTime(e.target.value)}
        className="border border-gray-300 rounded px-3 py-2 my-2"
      />
      <button
        onClick={handleSubmit}
        disabled={isLoading}
        className={`${
          isLoading ? 'bg-gray-500' : 'bg-blue-600 hover:bg-blue-700'
        } text-white font-semibold rounded py-2 px-4 transition`}
      >
        {isLoading ? 'Setting...' : 'Set Time'}
      </button>
    </section>
  );
}
