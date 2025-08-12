import { useState } from 'react';
import { loadSavedConfig } from '../api/telescopeAPI';

export default function LoadSavedConfig() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadConfig = async () => {
    if (!window.confirm("Are you sure you want to load the saved configuration?")) return;

    setIsLoading(true);
    try {
      const data = await loadSavedConfig();
      if (data.status === 'success') {
        alert('Configuration loaded successfully.');
      } else {
        alert('Failed to load configuration: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      alert('Error loading configuration: ' + error.message);
    }
    setIsLoading(false);
  };

  return (
    <section className="max-w-md">
      <button
        onClick={handleLoadConfig}
        disabled={isLoading}
        className={`${
          isLoading ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-700 hover:bg-blue-800 cursor-pointer'
        } text-white font-semibold rounded py-2 px-4 transition`}
      >
        {isLoading ? 'Loading...' : 'Load Configuration'}
      </button>
    </section>
  );
}
