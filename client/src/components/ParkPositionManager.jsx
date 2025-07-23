import { useEffect, useState } from 'react';
import {
  getParkPosition,
  setParkPosition,
  setParkOption
} from '../api/telescopeAPI';

export default function ParkPositionManager() {
  const [ra, setRa] = useState('');
  const [dec, setDec] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchPark() {
      try {
        const data = await getParkPosition();
        setRa(data.ra);
        setDec(data.dec);
      } catch (err) {
        setError('Failed to fetch park position');
      } finally {
        setLoading(false);
      }
    }

    fetchPark();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setParkPosition(ra, dec);
      alert('Park position updated.');
    } catch (err) {
      alert('Failed to set park position: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSetOption = async (option) => {
    try {
      await setParkOption(option);
      alert(`Park option "${option}" applied`);
    } catch (err) {
      alert('Failed to apply park option: ' + err.message);
    }
  };

  if (loading) return <p>Loading park position...</p>;
  //if (error) return <p className="text-red-500">{error}</p>;

  return (
    <section className="p-6 max-w-md bg-neutral-900 text-white rounded shadow space-y-4">
      <h2 className="text-lg font-semibold">Manage Park Position</h2>

      <div className="space-y-2">
        <label className="block">
          <span className="text-sm">RA (degrees)</span>
          <input
            type="text"
            value={ra}
            onChange={(e) => setRa(e.target.value)}
            className="w-full p-2 rounded bg-neutral-800 text-white border border-gray-600 focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="text-sm">DEC (degrees)</span>
          <input
            type="text"
            value={dec}
            onChange={(e) => setDec(e.target.value)}
            className="w-full p-2 rounded bg-neutral-800 text-white border border-gray-600 focus:outline-none"
          />
        </label>

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold"
        >
          {saving ? 'Saving...' : 'Save New Park Position'}
        </button>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm text-gray-300">Set Park Option:</h3>

        <button
          onClick={() => handleSetOption('PARK_CURRENT')}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold w-full"
        >
          Use Current Position as Park
        </button>

        <button
          onClick={() => handleSetOption('PARK_DEFAULT')}
          className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded font-semibold w-full"
        >
          Reset to Default Park Position
        </button>
      </div>
    </section>
  );
}
