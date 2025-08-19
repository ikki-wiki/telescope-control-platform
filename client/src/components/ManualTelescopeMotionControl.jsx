import React, { useState, useEffect } from "react";
import { moveTelescope } from "../api/telescopeAPI";
import { toast } from "react-hot-toast";
import CurrentTelescopePosition from "./CurrentTelescopePosition";

const OPPOSITES = {
  north: "south",
  south: "north",
  east: "west",
  west: "east",
};

const KEY_TO_DIR = {
  ArrowUp: "north",
  ArrowDown: "south",
  ArrowLeft: "west",
  ArrowRight: "east",
  " ": "stop", // Space bar -> stop
};

export default function TelescopeGamepad() {
  const [activeDirections, setActiveDirections] = useState([]);

  const showDirectionToast = (dir) => {
    if (dir === "stop") return;
    const label = dir.charAt(0).toUpperCase() + dir.slice(1);
    toast.loading(`Moving ${label}...`, { id: dir });
  };

  const activateDirection = (dir) => {
    if (dir === "stop") {
      setActiveDirections([]);
      toast.dismiss();
      moveTelescope("stop");
      return;
    }

    setActiveDirections((prev) => {
      const opposite = OPPOSITES[dir];

      // Cancel both if opposite is active
      if (prev.includes(opposite)) {
        toast.dismiss(dir);
        toast.dismiss(opposite);
        moveTelescope("stop");
        return prev.filter((d) => d !== opposite);
      }

      if (prev.includes(dir)) return prev;

      showDirectionToast(dir);
      moveTelescope(dir);
      return [...prev, dir];
    });
  };

  const deactivateDirection = (dir) => {
    setActiveDirections((prev) => {
      if (!prev.includes(dir)) return prev;

      const newDirs = prev.filter((d) => d !== dir);
      toast.dismiss(dir);

      if (newDirs.length === 0) {
        moveTelescope("stop");
      } else {
        moveTelescope(newDirs[newDirs.length - 1]);
      }

      return newDirs;
    });
  };

  // 🔑 Keyboard support (arrows + space)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (KEY_TO_DIR[e.key] !== undefined) {
        e.preventDefault();
        activateDirection(KEY_TO_DIR[e.key]);
      }
    };

    const handleKeyUp = (e) => {
      if (KEY_TO_DIR[e.key] !== undefined) {
        e.preventDefault();
        if (KEY_TO_DIR[e.key] !== "stop") {
          deactivateDirection(KEY_TO_DIR[e.key]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const btnClass =
    "p-3 rounded-xl bg-blue-600 text-white shadow active:scale-90 transition-transform disabled:bg-blue-300";
  const stopClass =
    "p-3 rounded-xl bg-red-600 text-white shadow active:scale-90 transition-transform disabled:bg-red-300";

  return (
    <div className="max-w-md">
      {/* Current Position Display */}
      <CurrentTelescopePosition />

      <div className="flex flex-col items-center space-y-4 mt-6">
        <div className="grid grid-cols-3 gap-3 w-48 items-center">
          <button
            aria-label="Move North"
            className={`${btnClass} col-start-2`}
            onMouseDown={() => activateDirection("north")}
            onMouseUp={() => deactivateDirection("north")}
          >
            ↑
          </button>

          <button
            aria-label="Move West"
            className={`${btnClass} col-start-1`}
            onMouseDown={() => activateDirection("west")}
            onMouseUp={() => deactivateDirection("west")}
          >
            ←
          </button>

          <button
            aria-label="Stop Movement"
            className={stopClass}
            onClick={() => activateDirection("stop")}
          >
            ■
          </button>

          <button
            aria-label="Move East"
            className={btnClass}
            onMouseDown={() => activateDirection("east")}
            onMouseUp={() => deactivateDirection("east")}
          >
            →
          </button>

          <button
            aria-label="Move South"
            className={`${btnClass} col-start-2`}
            onMouseDown={() => activateDirection("south")}
            onMouseUp={() => deactivateDirection("south")}
          >
            ↓
          </button>
        </div>
      </div>
    </div>
  );
}
