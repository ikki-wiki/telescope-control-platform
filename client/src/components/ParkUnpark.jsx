import { useState } from "react";
import { parkTelescope, unparkTelescope } from "../api/telescopeAPI";
import { toast } from "react-hot-toast";

export default function ParkUnpark() {
  const [isParked, setIsParked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePark = async () => {
    setIsLoading(true);
    const toastId = toast.loading("Parking telescope...");
    try {
      await parkTelescope();
      setIsParked(true);
      toast.success("Telescope parked", { id: toastId });
    } catch (err) {
      toast.error("Error parking telescope: " + err.message, { id: toastId });
    }
    setIsLoading(false);
  };

  const handleUnpark = async () => {
    setIsLoading(true);
    const toastId = toast.loading("Unparking telescope...");
    try {
      await unparkTelescope();
      setIsParked(false);
      toast.success("Telescope unparked", { id: toastId });
    } catch (err) {
      toast.error("Error unparking telescope: " + err.message, { id: toastId });
    }
    setIsLoading(false);
  };

  return (
    <section className="max-w-md">
      <div className="mb-4">
        <p>
          Status:{" "}
          <span
            className={`font-mono font-bold ${
              isParked ? "text-green-500" : "text-yellow-400"
            }`}
          >
            {isParked ? "Parked" : "Unparked"}
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
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700"
          } text-white px-4 py-2 rounded font-semibold transition`}
        >
          Park
        </button>

        <button
          type="button"
          onClick={handleUnpark}
          disabled={isLoading || !isParked}
          className={`${
            isLoading || !isParked
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          } text-white px-4 py-2 rounded font-semibold transition`}
        >
          Unpark
        </button>
      </div>
    </section>
  );
}
