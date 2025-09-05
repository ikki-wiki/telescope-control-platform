import { useState } from "react";
import { Telescope, Settings, ListChecks, Lightbulb } from "lucide-react";

export default function Tutorial() {
  const [active, setActive] = useState("control");

  const baseCardClasses =
    "border rounded-2xl p-6 shadow-sm flex flex-col items-center text-center cursor-pointer transition transform";

  const getCardClasses = (card) => {
    const isActive = active === card;
    return (
      baseCardClasses +
      " " +
      (isActive
        ? "bg-gray-700 border-blue-500 shadow-lg"
        : "bg-gray-900 border-gray-400 hover:bg-gray-800 hover:shadow-lg hover:border-gray-500 hover:scale-[1.02]")
    );
  };

  const getIconColor = (card, defaultColor) =>
    active === card ? defaultColor.replace("400", "500") : defaultColor;

  const tipStyle = "italic bg-gray-700 p-2 rounded mt-2 mb-2 text-gray-200";

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-center">User Guide</h1>

      <div className="grid grid-cols-2 gap-4 sm:gap-6">
        <div className={getCardClasses("control")} onClick={() => setActive("control")}>
          <Telescope className={`h-10 w-10 mb-2 ${getIconColor("control", "text-blue-400")}`} />
          <h2 className="text-xl font-semibold">Control Page</h2>
        </div>

        <div className={getCardClasses("settings")} onClick={() => setActive("settings")}>
          <Settings className={`h-10 w-10 mb-2 ${getIconColor("settings", "text-green-400")}`} />
          <h2 className="text-xl font-semibold">Settings Page</h2>
        </div>

        <div className={getCardClasses("workflow")} onClick={() => setActive("workflow")}>
          <ListChecks className={`h-10 w-10 mb-2 ${getIconColor("workflow", "text-yellow-400")}`} />
          <h2 className="text-xl font-semibold">Example Workflow</h2>
        </div>

        <div className={getCardClasses("tips")} onClick={() => setActive("tips")}>
          <Lightbulb className={`h-10 w-10 mb-2 ${getIconColor("tips", "text-purple-400")}`} />
          <h2 className="text-xl font-semibold">Tips</h2>
        </div>
      </div>

      <div className="shadow-lg rounded-2xl p-4 sm:p-6 space-y-4 bg-gray-800 border border-gray-600">
        {active === "control" && (
          <>
            <h2 className="text-3xl font-semibold mb-2">Control Page</h2>
            <p className="text-gray-300 text-justify mb-2">
              The Control page lets you move and manage your telescope efficiently. Use coordinate inputs, manual controls, and sync/park features to navigate the sky.
            </p>

            <h5 className="text-gray-200 text-xl font-semibold mt-4 mb-2">Move to Coordinates</h5>
            <p className="text-gray-300 text-justify mb-2">At the top, the telescope’s current coordinates are displayed:</p>
            <ul className="list-disc list-inside pl-4 text-gray-300 mb-2">
              <li>Right Ascension (RA)</li>
              <li>Declination (DEC)</li>
              <li>Azimuth (Az)</li>
              <li>Altitude (Alt)</li>
            </ul>
            <p className="text-gray-300 text-justify mb-2">These values update every second.</p>

            <h6 className="text-gray-200 font-semibold mt-2 mb-1">Object Lookup</h6>
            <ul className="list-disc list-inside pl-4 text-gray-300 mb-2">
              <li>Enter the name of a star, planet, or deep-sky object</li>
              <li>Click <strong>Load Coordinates</strong> to auto-fill RA/DEC</li>
            </ul>

            <h6 className="text-gray-200 font-semibold mt-2 mb-1">Manual Entry</h6>
            <ul className="list-disc list-inside pl-4 text-gray-300 mb-2">
              <li>Enter RA/DEC manually if needed</li>
              <li>Use <strong>Fill in with current telescope RA/DEC</strong> to copy current position</li>
            </ul>

            <h6 className="text-gray-200 font-semibold mt-2 mb-1">Accepted Coordinate Formats</h6>
            <ul className="list-disc list-inside pl-4 text-gray-300 mb-2">
              <li>RA: "12 34 56.7", "12:34:56.7", "12h34m56.7s", "12 34.945"</li>
              <li>DEC: "-12 34 56", "-12:34:56", "-12d34m56s", "-12º 34' 56", "-12º34'56", "-12 34.945"</li>
            </ul>

            <h6 className="text-gray-200 font-semibold mt-2 mb-1">Validation & Errors</h6>
            <ul className="list-disc list-inside pl-4 text-gray-300 mb-2">
              <li>Coordinates out of range show an error</li>
              <li>Telescope will not move if:</li>
              <ul className="list-disc list-inside pl-8 text-gray-300 mb-2">
                <li>Altitude is outside 0º–58º</li>
                <li>The telescope is parked</li>
                <li>The telescope is currently moving</li>
              </ul>
              <li>Use <strong>Sync to Coordinates</strong> to correct alignment without moving</li>
            </ul>

            <p className={tipStyle}>
              Tip: Use the <strong>Stop</strong> button to halt the telescope instantly if needed.
            </p>

            <h5 className="text-gray-200 text-xl font-semibold mt-4 mb-2">Manual Telescope Movement</h5>
            <ul className="list-disc list-inside pl-4 text-gray-300 mb-2">
              <li>Compass rose shows telescope orientation</li>
              <li>Use directional buttons or arrow keys for nudges</li>
              <li>Hold buttons for continuous movement</li>
              <li>Movement speed is determined by the <strong>Slew Rate</strong> from Settings</li>
              <li>Telescope stops automatically at altitude limits (0º–58º)</li>
            </ul>

            <h5 className="text-gray-200 text-xl font-semibold mt-4 mb-2">Park Telescope</h5>
            <ul className="list-disc list-inside pl-4 text-gray-300 mb-2">
              <li>Click <strong>Park Telescope</strong> to move to a safe position</li>
              <li>All actions are disabled until unparked</li>
              <li>Parking takes ~1 minute</li>
            </ul>
          </>
        )}

        {active === "settings" && (
          <>
            <h2 className="text-3xl font-semibold mb-2">Settings Page</h2>
            <p className="text-gray-300 mb-2">
              Configure key telescope parameters for accurate operation and tracking. Set your site, date/time, and movement speed before observing.
            </p>

            <h5 className="text-gray-200 text-xl font-semibold mt-4 mb-2">Site Information</h5>
            <p className="text-gray-300 mb-2">
              Enter the location where your telescope is operating for precise pointing. Input latitude, longitude, and elevation manually.
            </p>
            <ul className="list-disc list-inside pl-4 text-gray-300 mb-2">
              <li>Decimal degrees (e.g., 32.65)</li>
              <li>DMS format (e.g., 32° 39' N)</li>
              <li>Negative decimal for southern latitudes or western longitudes (e.g., -16.91)</li>
            </ul>
            <p className="text-gray-300 mb-2">
              Elevation should be in meters above sea level. Press <strong>Save site coordinates</strong> to update the telescope’s location.
            </p>

            <h5 className="text-gray-200 text-xl font-semibold mt-4 mb-2">Date & Time</h5>
            <p className="text-gray-300 mb-2">
              Set the current telescope date and time for proper tracking. Update date, UTC time, and UTC offset.
            </p>
            <p className="text-gray-300 mb-2">
              Press <strong>Save date, time and offset</strong> to apply changes.
            </p>
            <p className={tipStyle}>
              Tip: Updating time can help correct tracking errors if the telescope is misaligned.
            </p>

            <h5 className="text-gray-200 text-xl font-semibold mt-4 mb-2">Slew Rate</h5>
            <ul className="list-disc list-inside pl-4 text-gray-300 mb-2">
              <li><strong>Slowest (1x):</strong> Fine adjustments and precise centering</li>
              <li><strong>Slow (2x):</strong> Smaller moves with accuracy</li>
              <li><strong>Medium (3x):</strong> Balance of speed and precision</li>
              <li><strong>Maximum (4x):</strong> Fastest across large sky portions</li>
            </ul>
            <p className="text-gray-300 mb-2">
              Changes apply immediately to all telescope movements.
            </p>
          </>
        )}

        {active === "workflow" && (
          <>
            <h2 className="text-3xl font-semibold mb-2">Example Workflow</h2>
            <p className="text-gray-300 mb-2">
              Follow this workflow for smooth, safe, and efficient telescope operation.
            </p>

            <h5 className="text-gray-200 text-xl font-semibold mt-4 mb-2">1. Setup Observatory Environment</h5>
            <ul className="list-disc list-inside pl-4 text-gray-300 mb-2">
              <li>Enter correct <strong>Site Information</strong> (latitude, longitude, elevation)</li>
              <li>Set <strong>Date & Time</strong> and verify UTC offset</li>
              <li>Adjust <strong>Slew Rate</strong> for observation type</li>
            </ul>

            <h5 className="text-gray-200 text-xl font-semibold mt-4 mb-2">2. Control Telescope</h5>
            <ul className="list-disc list-inside pl-4 text-gray-300 mb-2">
              <li>Use <strong>Move to Coordinates</strong> for known RA/DEC</li>
              <li>Search objects by name to auto-fill coordinates</li>
              <li>Manual Movement with compass or arrow keys</li>
              <li>Monitor altitude limits (0º–58º)</li>
              <li>Adjust <strong>Slew Rate</strong> as needed</li>
            </ul>
            <p className={tipStyle}>
              Tip: Use <strong>Stop</strong> to halt movement immediately.
            </p>

            <h5 className="text-gray-200 text-xl font-semibold mt-4 mb-2">3. End Observation and Park Telescope</h5>
            <ul className="list-disc list-inside pl-4 text-gray-300 mb-2">
              <li>Press <strong>Park Telescope</strong> to move to safe position</li>
              <li>Do not move telescope until unparked</li>
              <li>Parking takes ~1 minute; monitor until completed</li>
            </ul>
            <p className="text-gray-300 mb-2">
              Following this workflow ensures accurate pointing, safe operation, and equipment protection.
            </p>
          </>
        )}

        {active === "tips" && (
          <>
            <h2 className="text-3xl font-semibold mb-2">Tips & Best Practices</h2>
            <p className="text-gray-300 mb-2">
              These tips help you use the telescope safely, efficiently, and get the best observation results.
            </p>

            <h5 className="text-gray-200 text-xl font-semibold mt-4 mb-2">General Tips</h5>
            <ul className="list-disc list-inside pl-4 text-gray-300 mb-2">
              <li>Always verify <strong>site coordinates, date, and time</strong> before slewing.</li>
              <li>Keep your observing area clear of obstacles to avoid collisions.</li>
            </ul>

            <h5 className="text-gray-200 text-xl font-semibold mt-4 mb-2">During Observation</h5>
            <ul className="list-disc list-inside pl-4 text-gray-300 mb-2">
              <li>Start with a <strong>slow slew rate</strong> when centering objects, then switch to faster speeds for large movements.</li>
              <li>Use the <strong>Stop</strong> button immediately if the telescope behaves unexpectedly.</li>
              <li>Regularly monitor the telescope’s <strong>current coordinates</strong> to ensure correct pointing.</li>
            </ul>

            <h5 className="text-gray-200 text-xl font-semibold mt-4 mb-2">Safety & Maintenance</h5>
            <ul className="list-disc list-inside pl-4 text-gray-300 mb-2">
              <li>Always <strong>park the telescope</strong> at the end of a session to move it to a safe position.</li>
            </ul>
            <p className="text-gray-300 mb-2">
              Following these tips maintains your equipment, ensures accurate observations, and provides a smooth and safe experience.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
