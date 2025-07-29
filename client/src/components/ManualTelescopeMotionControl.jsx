import React, { useState } from "react";
import { moveTelescope } from "../api/telescopeAPI";
import CurrentTelescopePosition from "./CurrentTelescopePosition"; // import the new component

export default function TelescopeGamepad() {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeButton, setActiveButton] = useState(null);

  const move = async (direction) => {
    setStatus("");
    setLoading(true);
    setActiveButton(direction);
    try {
      const data = await moveTelescope(direction);
      if (data.status === "success") {
        const dirText = direction === "stop" ? "Stop" : direction.charAt(0).toUpperCase() + direction.slice(1);
        setStatus(
          <>
            Telescope motion: <strong>{dirText}</strong>
          </>
        );
      } else {
        setStatus(`Failed to move: ${data.message || "Unknown error"}`);
      }
    } catch (err) {
      setStatus("Error moving telescope. Check console for details.");
      console.error("Error moving telescope:", err);
    }
    setLoading(false);

    // Remove active after animation duration (~150ms)
    setTimeout(() => setActiveButton(null), 150);
  };

  // Helper to get classes with animation and disabled styles
  const getButtonClass = (direction, baseClasses) => {
    const scaleClass = activeButton === direction ? "transform scale-90 transition-transform duration-150" : "transition-transform duration-150";
    return `${baseClasses} ${scaleClass}`;
  };

  return (
    <div className="max-w-md">

      {/* Current Position Display */}
      <CurrentTelescopePosition />
    <div className="flex flex-col items-center space-y-4 mt-6">
      <div className="grid grid-cols-3 gap-3 w-48 items-center">
        <button
          aria-label="Move North"
          className={getButtonClass(
            "north",
            "col-start-2 p-3 rounded-xl bg-blue-600 text-white shadow disabled:bg-blue-300"
          )}
          onClick={() => move("north")}
          disabled={loading}
        >
          ↑
        </button>

        <button
          aria-label="Move West"
          className={getButtonClass(
            "west",
            "col-start-1 p-3 rounded-xl bg-blue-600 text-white shadow disabled:bg-blue-300"
          )}
          onClick={() => move("west")}
          disabled={loading}
        >
          ←
        </button>

        <button
          aria-label="Stop Movement"
          className={getButtonClass(
            "stop",
            "p-3 rounded-xl bg-red-600 text-white shadow disabled:bg-red-300"
          )}
          onClick={() => move("stop")}
          disabled={loading}
        >
          ■
        </button>

        <button
          aria-label="Move East"
          className={getButtonClass(
            "east",
            "p-3 rounded-xl bg-blue-600 text-white shadow disabled:bg-blue-300"
          )}
          onClick={() => move("east")}
          disabled={loading}
        >
          →
        </button>

        <button
          aria-label="Move South"
          className={getButtonClass(
            "south",
            "col-start-2 p-3 rounded-xl bg-blue-600 text-white shadow disabled:bg-blue-300"
          )}
          onClick={() => move("south")}
          disabled={loading}
        >
          ↓
        </button>
      </div>

      {status && (
        <p
          className={`mt-4 ${
            status.toString().startsWith("Failed") || status.toString().startsWith("Error")
              ? "text-red-600"
              : "text-gray-300"
          } font-medium`}
        >
          {status}
        </p>
      )}
    </div>
    </div>
  );
}
