import { useState } from 'react';
import { moveTelescope, slewToCoordinates, getTelescopeInfo } from '../api/telescopeAPI';
import CoordinateSlew from '../components/CoordinateSlew';

export default function Control() {
  const [infoType, setInfoType] = useState('Altitude');
  const [infoResult, setInfoResult] = useState('');

  const handleMove = (dir) => moveTelescope(dir);
  const handleSlew = (ra, dec) => slewToCoordinates(ra, dec);
  const handleInfo = async () => {
    const result = await getTelescopeInfo(infoType);
    setInfoResult(result.message);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Telescope Control</h1>

      <div>
        <CoordinateSlew onSlew={handleSlew} />
      </div>

      <div>
        <h2 className="font-semibold">Directional Movement</h2>
        <div className="flex gap-2">
          <button onClick={() => handleMove('movenorth')} className="bg-gray-200 px-3 py-1 rounded">North</button>
          <button onClick={() => handleMove('movesouth')} className="bg-gray-200 px-3 py-1 rounded">South</button>
          <button onClick={() => handleMove('moveeast')} className="bg-gray-200 px-3 py-1 rounded">East</button>
          <button onClick={() => handleMove('movewest')} className="bg-gray-200 px-3 py-1 rounded">West</button>
          <button onClick={() => handleMove('stopMovement')} className="bg-red-500 text-white px-3 py-1 rounded">Stop</button>
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
        <button onClick={handleInfo} className="bg-green-500 text-white px-3 py-1 rounded">Fetch</button>
        <p className="mt-2">Result: <span className="font-mono">{infoResult}</span></p>
      </div>
    </div>
  );
}