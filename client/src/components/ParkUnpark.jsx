import { useState, useEffect } from 'react';
import { parkTelescope, unparkTelescope, getTelescopeParkingStatus } from '../api/telescopeAPI';

export default function ParkUnpark() {
  const [isParked, setIsParked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchParkingStatus = async () => {
    try {
      const status = await getTelescopeParkingStatus();
      //setIsParked(status === 'Parked');
    } catch (err) {
      console.error('Failed to get parking status:', err);
    }
  };

  useEffect(() => {
    fetchParkingStatus();
    const interval = setInterval(fetchParkingStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handlePark = async () => {
    setIsLoading(true);
    try {
      await parkTelescope();
      setIsParked(true)
      await fetchParkingStatus();
    } catch (err) {
      alert('Error parking telescope: ' + err.message);
    }
    setIsLoading(false);
  };

  const handleUnpark = async () => {
    setIsLoading(true);
    try {
      await unparkTelescope();
      setIsParked(false)
      await fetchParkingStatus();
    } catch (err) {
      alert('Error unparking telescope: ' + err.message);
    }
    setIsLoading(false);
  };

  return (
    <section className="p-6 max-w-md">

      <div className="mb-4">
        <p>
          Status:{' '}
          <span
            className={`font-mono font-bold ${
              isParked ? 'text-green-500' : 'text-yellow-400'
            }`}
          >
            {isParked ? 'Parked' : 'Unparked'}
          </span>
        </p>
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={handlePark}
          disabled={isLoading || isParked}
          className={`${
            isParked || isLoading
              ? 'bg-gray-500 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700'
          } text-white px-4 py-2 rounded font-semibold transition`}
        >
          {isLoading && isParked ? 'Parking...' : 'Park'}
        </button>

        <button
          type="button"
          onClick={handleUnpark}
          disabled={isLoading || !isParked}
          className={`${
            !isParked || isLoading
              ? 'bg-gray-500 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          } text-white px-4 py-2 rounded font-semibold transition`}
        >
          {isLoading && !isParked ? 'Unparking...' : 'Unpark'}
        </button>
      </div>
    </section>
  );
}
