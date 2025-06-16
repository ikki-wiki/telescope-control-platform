import { useState } from 'react';

export default function Settings() {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const sendDate = async () => {
    const res = await fetch('http://localhost:7123/api/setTime', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: 'date', value: date })
    });
    const data = await res.json();
    alert(data.message);
  };

  const sendTime = async () => {
    const res = await fetch('http://localhost:7123/api/setTime', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: 'hour', value: time })
    });
    const data = await res.json();
    alert(data.message);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Telescope Settings</h1>

      <div>
        <h2 className="font-semibold">Set Date</h2>
        <input className="border p-1 mr-2" placeholder="MM/DD/YY" value={date} onChange={e => setDate(e.target.value)} />
        <button className="bg-blue-500 text-white px-4 py-1 rounded" onClick={sendDate}>Set Date</button>
      </div>

      <div>
        <h2 className="font-semibold">Set Time</h2>
        <input className="border p-1 mr-2" placeholder="HH:MM:SS" value={time} onChange={e => setTime(e.target.value)} />
        <button className="bg-blue-500 text-white px-4 py-1 rounded" onClick={sendTime}>Set Time</button>
      </div>
    </div>
  );
}