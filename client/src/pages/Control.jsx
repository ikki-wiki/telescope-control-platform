import { useState } from 'react';

export default function Control() {
  const [ra, setRa] = useState('');
  const [dec, setDec] = useState('');
  const [infoType, setInfoType] = useState('Altitude');
  const [infoResult, setInfoResult] = useState('');

  const sendCoordinates = async () => {
    const res = await fetch('http://localhost:7123/api/coordinates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ RA: ra, DEC: dec })
    });
    const data = await res.json();
    alert(JSON.stringify(data));
  };

  const moveTelescope = async (cmd) => {
    await fetch('http://localhost:7123/api/movement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: cmd })
    });
  };

  const getInformation = async () => {
    const res = await fetch('http://localhost:7123/api/information', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: infoType })
    });
    const data = await res.json();
    setInfoResult(data.message);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Telescope Control</h1>

      <div>
        <h2 className="font-semibold">Coordinate Slew</h2>
        <input className="border p-1 mr-2" placeholder="RA (HH:MM:SS)" value={ra} onChange={e => setRa(e.target.value)} />
        <input className="border p-1 mr-2" placeholder="DEC (+DD*MM:SS)" value={dec} onChange={e => setDec(e.target.value)} />
        <button className="bg-blue-500 text-white px-4 py-1 rounded" onClick={sendCoordinates}>Go</button>
      </div>

      <div>
        <h2 className="font-semibold">Directional Movement</h2>
        <div className="flex gap-2">
          <button onClick={() => moveTelescope('movenorth')} className="bg-gray-200 px-3 py-1 rounded">North</button>
          <button onClick={() => moveTelescope('movesouth')} className="bg-gray-200 px-3 py-1 rounded">South</button>
          <button onClick={() => moveTelescope('moveeast')} className="bg-gray-200 px-3 py-1 rounded">East</button>
          <button onClick={() => moveTelescope('movewest')} className="bg-gray-200 px-3 py-1 rounded">West</button>
          <button onClick={() => moveTelescope('stopMovement')} className="bg-red-500 text-white px-3 py-1 rounded">Stop</button>
        </div>
      </div>

      <div>
        <h2 className="font-semibold">Get Info</h2>
        <select className="border p-1 mr-2" value={infoType} onChange={e => setInfoType(e.target.value)}>
          <option>Altitude</option>
          <option>Firmware</option>
          <option>Right_ascension</option>
          <option>Declination</option>
          <option>Site_longitude</option>
        </select>
        <button onClick={getInformation} className="bg-green-500 text-white px-3 py-1 rounded">Fetch</button>
        <p className="mt-2">Result: <span className="font-mono">{infoResult}</span></p>
      </div>
    </div>
  );
}