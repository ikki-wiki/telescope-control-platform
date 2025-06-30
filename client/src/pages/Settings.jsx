import { useState } from 'react';
import { setDate, setTime } from '../api/telescopeAPI';

export default function Settings() {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const handleDate = async () => {
    const res = await setDate(date);
    alert(res.message);
  };

  const handleTime = async () => {
    const res = await setTime(time);
    alert(res.message);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Telescope Settings</h1>

      <div>
        <h2 className="font-semibold">Set Date</h2>
        <input className="border p-1 mr-2" placeholder="MM/DD/YY" value={date} onChange={e => setDate(e.target.value)} />
        <button className="bg-blue-500 text-white px-4 py-1 rounded" onClick={handleDate}>Set Date</button>
      </div>

      <div>
        <h2 className="font-semibold">Set Time</h2>
        <input className="border p-1 mr-2" placeholder="HH:MM:SS" value={time} onChange={e => setTime(e.target.value)} />
        <button className="bg-blue-500 text-white px-4 py-1 rounded" onClick={handleTime}>Set Time</button>
      </div>
    </div>
  );
}