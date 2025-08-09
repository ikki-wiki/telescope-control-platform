import { useState, useEffect, useRef } from 'react';
import { getUTCTime, setUTCTime } from '../api/telescopeAPI';

export default function DateTimeControl() {
  const [currentDate, setCurrentDate] = useState('');
  const [newDate, setNewDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [newTime, setNewTime] = useState('');
  const [offset, setOffset] = useState('0.00');
  const [newOffset, setNewOffset] = useState('0.00');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch current date, time, offset on mount
  useEffect(() => {
    const fetchDateTime = async () => {
      try {
        const { date, time, offset } = await getUTCTime();
        if (date && time && offset !== undefined) {
            setCurrentDate(date);
            setNewDate(date);    // prefill date for submission
            setCurrentTime(time);
            setNewTime(time);    // prefill time for submission
            setOffset(parseFloat(offset).toFixed(2));
            setNewOffset(parseFloat(offset).toFixed(2));
        }
      } catch (err) {
        console.error('Failed to fetch current datetime and offset:', err);
      }
    }
    fetchDateTime();
  }, []);

  const handleSubmit = async () => {
    if (!newDate || !newTime || !newOffset) {
      alert('Please select both date, time and offset');
      return;
    }
    setIsLoading(true);
    try {
        const utcTime = {
            date: newDate,
            time: newTime,
            offset: parseFloat(newOffset).toFixed(2)
        }
      // You probably want to send date and time separately for compatibility with your API
      const status = await setUTCTime(utcTime);
      setOffset(parseFloat(newOffset).toFixed(2));
      setNewDate('');
      setNewTime('');
      setNewOffset('0.00');
    } catch (err) {
      alert('Failed to set date/time');
    }
    setIsLoading(false);
  };

  const offsetOptions = Array.from({ length: 113 }, (_, i) => (i * 0.25 - 14).toFixed(2));

  return (
    <section className="w-full">
      <p>
        Current telescope date: <strong>{currentDate|| 'Loading...'}</strong>
      </p>
      <p>
        Current telescope time: <strong>{currentTime || 'Loading...'} {offset > 0 ? `+${offset}` : offset}</strong>
      </p>
      
      <div className="flex flex-col gap-4 mt-4 sm:flex-row">
        <div className="flex flex-col w-full">
          <label htmlFor="date" className="text-sm font-medium mb-1">Date</label>
          <input type="date" id="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="border rounded-lg px-3 py-2 text-sm w-full" />
        </div>
        <div className="flex flex-col w-full">
          <label htmlFor="time" className="text-sm font-medium mb-1">Time (UTC)</label>
          <input type="time" step={1} id="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="border rounded-lg px-3 py-2 text-sm w-full" />
        </div>
        <div className="flex flex-col w-full">
          <label htmlFor="offset" className="text-sm font-medium mb-1">UTC Offset</label>
          <select id="offset" value={newOffset} onChange={(e) => setNewOffset(e.target.value)} className="border rounded-lg px-3 py-2 text-sm w-full">
            {offsetOptions.map((off) => (
              <option key={off} value={off} className="bg-gray-900 text-gray-100">{off >= 0 ? `+${off}` : off}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={isLoading}
        className={`w-full mt-4 ${isLoading ? 'bg-gray-500' : 'bg-blue-600 hover:bg-blue-700'} text-white font-semibold rounded py-2 px-4 transition`}
      >
        {isLoading ? 'Setting...' : 'Set Date and Time'}
      </button>
    </section>
  );
}
