import { useState, useEffect } from 'react';
import { setDate, getDate } from '../api/telescopeAPI';

export default function DateControl() {
  const [currentDate, setCurrentDate] = useState('');
  const [newDate, setNewDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch current date from telescope every 10 seconds
  useEffect(() => {
    const fetchDate = async () => {
        try {
            const info = await getDate();
            setCurrentDate(info.date);
        } catch (err) {
            console.error('Failed to fetch date', err);
        }
    };
    fetchDate();
    const interval = setInterval(fetchDate, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async () => {
    if (!newDate) {
      alert('Please select a date');
      return;
    }
    setIsLoading(true);
    try {
      await setDate(newDate);
      setCurrentDate(newDate);
      setNewDate('');
    } catch (error) {
      alert('Failed to set date');
    }
    setIsLoading(false);
  };

  return (
    <section className="p-6 max-w-md">
      <h2 className="text-xl font-semibold mb-4">Set Telescope Date</h2>
      <p>Current telescope date: <strong>{currentDate || 'Loading...'}</strong></p>
      <input
        type="date"
        value={newDate}
        onChange={e => setNewDate(e.target.value)}
        className="border border-gray-300 rounded px-3 py-2 my-2"
      />
      <button
        onClick={handleSubmit}
        disabled={isLoading}
        className={`${
          isLoading ? 'bg-gray-500' : 'bg-blue-600 hover:bg-blue-700'
        } text-white font-semibold rounded py-2 px-4 transition`}
      >
        {isLoading ? 'Setting...' : 'Set Date'}
      </button>
    </section>
  );
}
