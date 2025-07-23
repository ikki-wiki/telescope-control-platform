import { useState } from 'react';
import { abortMotion } from '../api/telescopeAPI';

export default function AbortMotion() {
  const [isLoading, setIsLoading] = useState(false);

  const handleAbort = async () => {
    if (!window.confirm("Are you sure you want to abort the current motion?")) return;

    setIsLoading(true);
    try {
      const data = await abortMotion();
      if (data.status === 'success') {
        alert('Motion aborted successfully.');
      } else {
        alert('Failed to abort motion: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      alert('Error aborting motion: ' + error.message);
    }
    setIsLoading(false);
  };

  return (
    <section className="p-6 max-w-md">
      <h2 className="text-xl font-semibold mb-4">Abort Telescope Motion</h2>
      <button
        onClick={handleAbort}
        disabled={isLoading}
        className={`${
          isLoading ? 'bg-gray-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 cursor-pointer'
        } text-white font-semibold rounded py-2 px-4 transition`}
      >
        {isLoading ? 'Aborting...' : 'Abort Motion'}
      </button>
    </section>
  );
}
