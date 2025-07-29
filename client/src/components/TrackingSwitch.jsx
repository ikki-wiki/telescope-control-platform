import { useEffect, useState } from "react";
import { getTrackingState, setTrackingState } from "../api/telescopeAPI";

export default function TrackingSwitch() {
  const [isTracking, setIsTracking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchTrackingState = async () => {
    try {
      const currentState = await getTrackingState(); // Should return true or false
      setIsTracking(currentState);
    } catch (err) {
      setError("Failed to fetch tracking state.");
      console.error("Tracking state error:", err);
    }
  };

  useEffect(() => {
    fetchTrackingState();
    const interval = setInterval(fetchTrackingState, 3000); // Optional polling
    return () => clearInterval(interval);
  }, []);

  const toggleTracking = async () => {
    setLoading(true);
    setError("");
    try {
      await setTrackingState(!isTracking);
      setIsTracking((prev) => !prev);
    } catch (err) {
      setError("Failed to toggle tracking.");
      console.error("Error toggling tracking:", err);
    }
    setLoading(false);
  };

  return (
    <div className="mb-4 max-w-md">
      <div className="flex items-center justify-between mb-4">
        <span className="font-medium">Tracking:</span>
        <button
          onClick={toggleTracking}
          disabled={loading}
          className={`px-4 py-1 rounded text-white font-semibold transition ${
            isTracking
              ? "bg-green-600 hover:bg-green-700"
              : "bg-gray-600 hover:bg-gray-700"
          } disabled:opacity-50`}
        >
          {loading ? "..." : isTracking ? "ON" : "OFF"}
        </button>
      </div>
      {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
    </div>
  );
}
