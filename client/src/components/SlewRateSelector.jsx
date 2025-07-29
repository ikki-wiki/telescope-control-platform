import { useEffect, useState } from "react";
import { getSlewRate, setSlewRate } from "../api/telescopeAPI";

// Mapping INDI names to user-friendly labels and descriptions
const SLEW_RATE_DETAILS = {
  SLEW_GUIDE: {
    label: "Slowest",
    description: "0.5x to 1.0x sidereal rate or slowest possible speed.",
  },
  SLEW_CENTERING: {
    label: "Slow",
    description: "Slow speed.",
  },
  SLEW_FIND: {
    label: "Medium",
    description: "Medium speed.",
  },
  SLEW_MAX: {
    label: "Maximum",
    description: "Maximum speed.",
  },
};

export default function SlewRateSelector() {
  const [availableRates, setAvailableRates] = useState([]);
  const [selectedRate, setSelectedRate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchRates = async () => {
    try {
      const { rates, current } = await getSlewRate();
      setAvailableRates(rates);
      setSelectedRate(current);
    } catch (err) {
      setError("Failed to fetch slew rate.");
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const handleChange = async (e) => {
    const newRate = e.target.value;
    setLoading(true);
    setError("");
    try {
      await setSlewRate(newRate);
      setSelectedRate(newRate);
    } catch (err) {
      setError("Failed to set slew rate.");
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="mt-4 p-4">
      <label className="block font-medium mb-2">Slew Rate:</label>
      <select
        value={selectedRate}
        onChange={handleChange}
        disabled={loading}
        className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white"
      >
        <option value="" disabled>
          Select a rate
        </option>
        {availableRates.map((rate) => (
          <option
            key={rate}
            value={rate}
            title={SLEW_RATE_DETAILS[rate]?.description || rate}
          >
            {SLEW_RATE_DETAILS[rate]?.label || rate}
          </option>
        ))}
      </select>
      {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
    </div>
  );
}
