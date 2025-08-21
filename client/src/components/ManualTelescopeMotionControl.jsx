import React, { useState, useEffect } from "react";
import { moveTelescope } from "../api/telescopeAPI";
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

export default function TelescopeGamepad() {
  const [activeDirections, setActiveDirections] = useState([]);

  useEffect(() => {
    if (activeDirections.length === 0) {
      toast.dismiss("direction");
      moveTelescope("stop");
      return;
    }
    const label = directionLabel(activeDirections);
    toast.loading(`Moving ${label}...`, { id: "direction" });
    moveTelescope(activeDirections[activeDirections.length - 1]);
  }, [activeDirections]);

  const activateDirection = (dir) => {
    if (dir === "stop") {
      setActiveDirections([]);
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

  // Base button classes
  const baseBtnClass =
    "p-3 rounded-xl text-white shadow transition-transform disabled:bg-blue-300 text-3xl select-none";

  // Compute button classes with active/pressed effect
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
            className={`${getBtnClass("north")} col-start-2`}
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
            className={getBtnClass("east")}
            onMouseDown={() => activateDirection("east")}
            onMouseUp={() => deactivateDirection("east")}
            onMouseLeave={() => deactivateDirection("east")}
          >
            →
          </button>

          <button
            aria-label="Move South"
            className={`${getBtnClass("south")} col-start-2`}
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
