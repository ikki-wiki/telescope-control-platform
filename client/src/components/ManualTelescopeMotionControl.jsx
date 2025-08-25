import React, { useState, useEffect } from "react";
import { moveTelescope, getTelescopeCoordinates } from "../api/telescopeAPI";
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
  ArrowLeft: "east",
  ArrowRight: "west",
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
const MAX_ALTITUDE = 58;

export default function TelescopeGamepad() {
  const [activeDirections, setActiveDirections] = useState([]);
  const [currentAltitude, setCurrentAltitude] = useState(null);
  const [isNorthDisabled, setIsNorthDisabled] = useState(false);
  const [isSouthDisabled, setIsSouthDisabled] = useState(false);

  const fetchAltitude = async () => {
    try {
      const data = await getTelescopeCoordinates();
      if (data.status === "success") {
        const alt = data.alt;
        setCurrentAltitude(alt);

        setIsNorthDisabled(alt >= MAX_ALTITUDE);
        setIsSouthDisabled(alt <= MIN_ALTITUDE);
      }
    } catch (e) {
      console.error("Failed to fetch altitude", e);
    }
  };

  // Poll telescope altitude
  useEffect(() => {
    fetchAltitude();
    const pollInterval = setInterval(fetchAltitude, 200);
    return () => clearInterval(pollInterval);
  }, []);

  const activateDirection = (dir) => {
    if (dir === "stop") {
      setActiveDirections([]);
      return;
    }
    if ((dir === "north" && isNorthDisabled) || (dir === "south" && isSouthDisabled)) {
      return; // ignore blocked directions
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
      const dir = KEY_TO_DIR[e.key];
      if (!dir) return;

      e.preventDefault();

      // Ignore keydown if direction is blocked
      if ((dir === "north" && isNorthDisabled) || (dir === "south" && isSouthDisabled)) {
        return;
      }

      activateDirection(dir);
    };

    const handleKeyUp = (e) => {
      const dir = KEY_TO_DIR[e.key];
      if (!dir) return;

      e.preventDefault();
      if (dir !== "stop") {
        deactivateDirection(dir);
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

    const latestDirection = activeDirections[activeDirections.length - 1];
    const label = directionLabel(activeDirections);

    // Altitude limit safety
    if (latestDirection === "north" && isNorthDisabled) {
      setActiveDirections((prev) => prev.filter((d) => d !== "north"));
      moveTelescope("stop");
      toast.dismiss("direction");
      toast.error("Reached maximum altitude limit", { id: "direction" });
      return;
    }
    if (latestDirection === "south" && isSouthDisabled) {
      setActiveDirections((prev) => prev.filter((d) => d !== "south"));
      moveTelescope("stop");
      toast.dismiss("direction");
      toast.error("Reached minimum altitude limit", { id: "direction" });
      return;
    }

    // If trying to move East/West while stuck at limit
    if ((latestDirection === "east" || latestDirection === "west") &&
        (isNorthDisabled || isSouthDisabled)) {
      toast.dismiss("direction");
      if (isNorthDisabled) {
        toast.error("Above maximum altitude limit: move South", { id: "direction" });
      } else if (isSouthDisabled) {
        toast.error("Below minimum altitude limit: move North", { id: "direction" });
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
            N
          </button>

          <button
            aria-label="Move West"
            className={`${getBtnClass("east")} col-start-1`}
            onMouseDown={() => activateDirection("east")}
            onMouseUp={() => deactivateDirection("east")}
            onMouseLeave={() => deactivateDirection("east")}
          >
            W
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
            className={`${getBtnClass("west")} col-start-3`}
            onMouseDown={() => activateDirection("west")}
            onMouseUp={() => deactivateDirection("west")}
            onMouseLeave={() => deactivateDirection("west")}
          >
            E
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
            S
          </button>
        </div>
      </div>
    </div>
  );
}
