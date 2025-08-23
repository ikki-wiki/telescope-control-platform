import React, { useState, useEffect } from "react";
import { moveTelescope } from "../api/telescopeAPI";
import { getTelescopeCoordinates } from "../api/telescopeAPI";
import { toast } from "react-hot-toast";
import Compass from "./Compass";

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

const directionLabel = (dirs) => {
  if (dirs.length === 0) return "";
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const northSouth = dirs.filter((d) => d === "north" || d === "south");
  const eastWest = dirs.filter((d) => d === "east" || d === "west");
  return [...northSouth, ...eastWest].map(cap).join("-");
};

const MIN_ALTITUDE = 0;
const MAX_ALTITUDE = 68;

export default function TelescopeGamepad() {
  const [activeDirections, setActiveDirections] = useState([]);
  const [currentAltitude, setCurrentAltitude] = useState(null);
  const [isNorthDisabled, setIsNorthDisabled] = useState(false);
  const [isSouthDisabled, setIsSouthDisabled] = useState(false);

  // Poll telescope altitude every second
  useEffect(() => {
    async function fetchAltitude() {
      try {
        const data = await getTelescopeCoordinates();
        if (data.status === "success") {
          const alt = data.alt;
          setCurrentAltitude(alt);

          // update disable state
          setIsNorthDisabled(alt >= MAX_ALTITUDE);
          setIsSouthDisabled(alt <= MIN_ALTITUDE);
        }
      } catch (e) {
        console.error("Failed to fetch altitude", e);
      }
    }

    fetchAltitude();
    const pollInterval = setInterval(fetchAltitude, 1000);
    return () => clearInterval(pollInterval);
  }, []);

  const activateDirection = (dir) => {
    if (dir === "stop") {
      setActiveDirections([]);
      return;
    }

    if ((dir === "north" && isNorthDisabled) || (dir === "south" && isSouthDisabled)) {
      return;
    }

    setActiveDirections((prev) => {
      const opposite = OPPOSITES[dir];
      if (prev.includes(opposite)) {
        return prev.filter((d) => d !== opposite);
      }
      if (prev.includes(dir)) return prev;
      return [...prev, dir];
    });
  };

  const deactivateDirection = (dir) => {
    setActiveDirections((prev) => prev.filter((d) => d !== dir));
  };

  // Keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (KEY_TO_DIR[e.key] !== undefined) {
        e.preventDefault();
        const dir = KEY_TO_DIR[e.key];
        if ((dir === "north" && isNorthDisabled) || (dir === "south" && isSouthDisabled)) {
          return;
        }
        activateDirection(dir);
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
  }, [isNorthDisabled, isSouthDisabled]);

  // Send movement commands
  useEffect(() => {
    if (activeDirections.length === 0) {
      toast.dismiss("direction");
      moveTelescope("stop");
      return;
    }

    const label = directionLabel(activeDirections);
    const latestDirection = activeDirections[activeDirections.length - 1];

    if (latestDirection === "north" && isNorthDisabled) {
      toast.dismiss("direction");
      toast.error("Reached maximum altitude limit", { id: "direction" });
      return;
    }
    if (latestDirection === "south" && isSouthDisabled) {
      toast.dismiss("direction");
      toast.error("Reached minimum altitude limit", { id: "direction" });
      return;
    }

    // If at altitude limit and trying to move East/West
    if ((latestDirection === "east" || latestDirection === "west") &&
        (isNorthDisabled || isSouthDisabled)) {
      toast.dismiss("direction");
      if (isNorthDisabled) {
        toast.error("Above maximum altitude limit: move the telescope South", {
          id: "direction",
        });
      } else if (isSouthDisabled) {
        toast.error("Below minimum altitude limit: move the telescope North", {
          id: "direction",
        });
      }
      return;
    }

    toast.dismiss("direction");
    toast.loading(`Moving ${label}...`, { id: "direction" });
    moveTelescope(latestDirection);
  }, [activeDirections, isNorthDisabled, isSouthDisabled]);

  const baseBtnClass =
    "p-3 rounded-xl text-white shadow transition-transform disabled:bg-blue-300 text-3xl select-none";
  const getBtnClass = (dir) => {
    const isActive = activeDirections.includes(dir);
    const baseColor = dir === "stop" ? "bg-red-600" : "bg-blue-600";
    const activeColor = dir === "stop" ? "bg-red-700" : "bg-blue-800";
    return `${baseBtnClass} ${isActive ? activeColor : baseColor} ${
      isActive ? "scale-95" : ""
    }`;
  };

  return (
    <div className="justify-items-center">
      <Compass activeDirections={activeDirections} />
      <div className="flex flex-col items-center space-y-6 mt-8">
        <div className="grid grid-cols-3 gap-6 w-64 items-center">
          <button
            aria-label="Move North"
            disabled={isNorthDisabled}
            className={`${getBtnClass("north")} col-start-2 ${
              isNorthDisabled ? "cursor-not-allowed bg-gray-300 opacity-50" : ""
            }`}
            onMouseDown={() => activateDirection("north")}
            onMouseUp={() => deactivateDirection("north")}
            onMouseLeave={() => deactivateDirection("north")}
          >
            ↑
          </button>

          <button
            aria-label="Move West"
            className={`${getBtnClass("west")} col-start-1`}
            onMouseDown={() => activateDirection("west")}
            onMouseUp={() => deactivateDirection("west")}
            onMouseLeave={() => deactivateDirection("west")}
          >
            ←
          </button>

          <button
            aria-label="Stop Movement"
            className={getBtnClass("stop")}
            onClick={() => activateDirection("stop")}
          >
            ■
          </button>

          <button
            aria-label="Move East"
            className={`${getBtnClass("east")} col-start-3`}
            onMouseDown={() => activateDirection("east")}
            onMouseUp={() => deactivateDirection("east")}
            onMouseLeave={() => deactivateDirection("east")}
          >
            →
          </button>

          <button
            aria-label="Move South"
            disabled={isSouthDisabled}
            className={`${getBtnClass("south")} col-start-2 ${
              isSouthDisabled ? "cursor-not-allowed bg-gray-300 opacity-50" : ""
            }`}
            onMouseDown={() => activateDirection("south")}
            onMouseUp={() => deactivateDirection("south")}
            onMouseLeave={() => deactivateDirection("south")}
          >
            ↓
          </button>
        </div>
      </div>
    </div>
  );
}
