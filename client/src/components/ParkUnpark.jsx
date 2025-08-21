import { useState } from "react";
import { parkTelescope, unparkTelescope } from "../api/telescopeAPI";
import { toast } from "react-hot-toast";

export default function ParkUnpark() {
  const [isParked, setIsParked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showParkConfirm, setShowParkConfirm] = useState(false);

  const handlePark = async () => {
    setShowParkConfirm(false);
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
    <section className="max-w-md mx-auto">
      {/* Button to trigger confirmation modal */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => setShowParkConfirm(true)}
          disabled={isLoading || isParked}
          className={`${
            isParked || isLoading
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700 focus:ring-4 focus:ring-red-700/50"
          } text-white px-6 py-3 rounded font-semibold transition text-lg`}
        >
          Park Telescope
        </button>
        {/*<button
          type="button"
          onClick={handleUnpark}
          disabled={isLoading || isParked}
          className={`${
            isParked || isLoading
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700 focus:ring-4 focus:ring-red-700/50"
          } text-white px-6 py-3 rounded font-semibold transition text-lg`}
        >
          Unpark Telescope
        </button>*/}
      </div>

      {/* PARK confirmation modal */}
      {showParkConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="park-modal-title"
          tabIndex={-1}
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 transition-opacity duration-300"
        >
          <div className="bg-gray-900 rounded-lg p-8 shadow-xl max-w-sm w-full transform transition-transform duration-300 scale-100">
            <h2
              id="park-modal-title"
              className="text-2xl font-semibold mb-6 flex items-center gap-3 text-white select-none"
            >
              <svg
                className="w-7 h-7 text-red-500 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01M12 5a7 7 0 11-7 7 7 7 0 017-7z"
                />
              </svg>
              Confirm Park
            </h2>
            <p className="mb-8 text-gray-300 leading-relaxed text-base">
              Are you sure you want to <strong>park the telescope</strong>?
              <br />
              <br />
              This will move the telescope to its safe parked position and won't allow
              any other actions besides turning off the telescope.
            </p>
            <div className="flex justify-between gap-4">
              <button
                onClick={() => setShowParkConfirm(false)}
                className="px-5 py-3 bg-red-800 rounded hover:bg-red-900 focus:outline-none focus:ring-4 focus:ring-red-700/60 text-white font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handlePark}
                disabled={isLoading}
                className="px-5 py-3 bg-blue-700 rounded hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-600/60 text-white font-semibold transition disabled:opacity-70"
              >
                {isLoading ? "Parking..." : "Yes, Park"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
