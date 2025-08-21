import { useEffect, useState } from "react";
import { getSlewRate, setSlewRate } from "../api/telescopeAPI";
import { toast } from "react-hot-toast";

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

  const fetchRates = async () => {
    try {
      const { rates, current } = await getSlewRate();
      setAvailableRates(rates);
      setSelectedRate(current);
    } catch (err) {
      toast.error("Failed to fetch slew rate.");
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const handleChange = async (e) => {
    const newRate = e.target.value;
    setLoading(true);
    const toastId = toast.loading("Setting slew rate...");
    try {
      await setSlewRate(newRate);
      setSelectedRate(newRate);
      toast.success("Slew rate set successfully", { id: toastId });
    } catch (err) {
      toast.error("Failed to set slew rate.", { id: toastId });
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md">
      <label className="block text-sm font-medium mb-1">Current Slew Rate</label>
      <select
        value={selectedRate}
        onChange={handleChange}
        disabled={loading}
        className="w-full p-2 rounded bg-gray-900 text-gray-100 border"
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
    </div>
  );
}
