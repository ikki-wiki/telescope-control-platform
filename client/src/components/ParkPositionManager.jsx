import { useEffect, useState } from "react";
import { getParkPosition, setParkPosition, setParkOption } from "../api/telescopeAPI";

export default function ParkPositionManager() {
  const [ra, setRa] = useState({ h: "", m: "", s: "" });
  const [dec, setDec] = useState({ sign: "+", d: "", m: "", s: "" });
  const [savedPosition, setSavedPosition] = useState(null);
  const [error, setError] = useState("");

  const fetchPark = async () => {
    try {
      const data = await getParkPosition();
      const raDeg = data.ra;
      const decDeg = data.dec;

      const raH = Math.floor(raDeg / 15);
      const raM = Math.floor((raDeg / 15 - raH) * 60);
      const raS = (((raDeg / 15 - raH) * 60 - raM) * 60).toFixed(2);

      const decSign = decDeg < 0 ? "-" : "+";
      const absDec = Math.abs(decDeg);
      const decD = Math.floor(absDec);
      const decM = Math.floor((absDec - decD) * 60);
      const decS = (((absDec - decD) * 60 - decM) * 60).toFixed(2);

      setSavedPosition({
        ra: { h: raH, m: raM, s: raS, deg: raDeg.toFixed(5) },
        dec: { sign: decSign, d: decD, m: decM, s: decS, deg: decDeg.toFixed(5) },
      });
    } catch (err) {
      setError("Failed to load park position.");
    }
  };

  useEffect(() => {
    fetchPark(); // Initial fetch
    const interval = setInterval(fetchPark, 5000); // Auto-refresh every 5 sec
    return () => clearInterval(interval);
  }, []);

  const convertRaToDegrees = (h, m, s) => (+h + +m / 60 + +s / 3600) * 15;
  const convertDecToDegrees = (sign, d, m, s) => {
    const deg = +d + +m / 60 + +s / 3600;
    return sign === "-" ? -deg : deg;
  };

  const isValidRa = (h, m, s) =>
    [h, m, s].every(n => !isNaN(+n)) &&
    +h >= 0 && +h < 24 &&
    +m >= 0 && +m < 60 &&
    +s >= 0 && +s < 60;

  const isValidDec = (d, m, s) =>
    [d, m, s].every(n => !isNaN(+n)) &&
    +d >= 0 && +d <= 90 &&
    +m >= 0 && +m < 60 &&
    +s >= 0 && +s < 60;

  const handlePaste = (e, setter, type = "ra") => {
    const text = e.clipboardData.getData("Text").trim();
    const match = type === "ra"
      ? /^(\d{1,2}):(\d{1,2}):(\d{1,2}(\.\d+)?)$/.exec(text)
      : /^([+-]?)(\d{1,2}):(\d{1,2}):(\d{1,2}(\.\d+)?)$/.exec(text);

    if (match) {
      e.preventDefault();
      if (type === "ra") {
        setter({ h: match[1], m: match[2], s: match[3] });
      } else {
        const sign = match[1] === "-" ? "-" : "+";
        setter({ sign, d: match[2], m: match[3], s: match[4] });
      }
    }
  };

  const handleSubmit = async () => {
    if (!isValidRa(ra.h, ra.m, ra.s)) return alert("Invalid RA format");
    if (!isValidDec(dec.d, dec.m, dec.s)) return alert("Invalid DEC format");

    const raDeg = convertRaToDegrees(ra.h, ra.m, ra.s);
    const decDeg = convertDecToDegrees(dec.sign, dec.d, dec.m, dec.s);

    try {
      await setParkPosition(raDeg, decDeg);
      alert("Park position set!");
      fetchPark(); // Refresh immediately after setting
    } catch {
      alert("Failed to set park position.");
    }
  };

  const handleParkOption = async (option) => {
    try {
      await setParkOption(option);
      alert(`Park option "${option}" applied.`);
      fetchPark();
    } catch {
      alert("Failed to set park option.");
    }
  };

  return (
    <div className="space-y-4 max-w-md p-4 bg-neutral-900 text-white rounded">
      <h2 className="text-lg font-bold">Set Park Position</h2>

      {error && <p className="text-red-500">{error}</p>}

      {savedPosition && (
        <div className="text-sm text-gray-300">
          <p className="mb-1 font-semibold">Current Saved Park Position:</p>
          <p>
            RA: {savedPosition.ra.h}:{savedPosition.ra.m}:{savedPosition.ra.s} ({savedPosition.ra.deg}°)
          </p>
          <p>
            DEC: {savedPosition.dec.sign}{savedPosition.dec.d}:{savedPosition.dec.m}:{savedPosition.dec.s} ({savedPosition.dec.deg}°)
          </p>
        </div>
      )}

      <div className="space-y-2">
        <label className="block font-medium">RA (HH:MM:SS.S)</label>
        <div className="flex gap-2">
          <input
            value={ra.h}
            onChange={e => setRa({ ...ra, h: e.target.value })}
            onPaste={e => handlePaste(e, setRa, "ra")}
            placeholder={savedPosition?.ra.h}
            className="w-1/3 p-2 bg-neutral-800 rounded"
          />
          <input
            value={ra.m}
            onChange={e => setRa({ ...ra, m: e.target.value })}
            onPaste={e => handlePaste(e, setRa, "ra")}
            placeholder={savedPosition?.ra.m}
            className="w-1/3 p-2 bg-neutral-800 rounded"
          />
          <input
            value={ra.s}
            onChange={e => setRa({ ...ra, s: e.target.value })}
            onPaste={e => handlePaste(e, setRa, "ra")}
            placeholder={savedPosition?.ra.s}
            className="w-1/3 p-2 bg-neutral-800 rounded"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block font-medium">DEC (±DD:MM:SS.S)</label>
        <div className="flex gap-2">
          <select
            value={dec.sign}
            onChange={e => setDec({ ...dec, sign: e.target.value })}
            className="w-1/4 p-2 bg-neutral-800 rounded"
          >
            <option value="+">+</option>
            <option value="-">−</option>
          </select>
          <input
            value={dec.d}
            onChange={e => setDec({ ...dec, d: e.target.value })}
            onPaste={e => handlePaste(e, setDec, "dec")}
            placeholder={savedPosition?.dec.d}
            className="w-1/4 p-2 bg-neutral-800 rounded"
          />
          <input
            value={dec.m}
            onChange={e => setDec({ ...dec, m: e.target.value })}
            onPaste={e => handlePaste(e, setDec, "dec")}
            placeholder={savedPosition?.dec.m}
            className="w-1/4 p-2 bg-neutral-800 rounded"
          />
          <input
            value={dec.s}
            onChange={e => setDec({ ...dec, s: e.target.value })}
            onPaste={e => handlePaste(e, setDec, "dec")}
            placeholder={savedPosition?.dec.s}
            className="w-1/4 p-2 bg-neutral-800 rounded"
          />
        </div>
      </div>

      <p className="text-sm text-gray-400">
        Converted: RA {isValidRa(ra.h, ra.m, ra.s) ? convertRaToDegrees(ra.h, ra.m, ra.s).toFixed(5) : "—"}°, 
        DEC {isValidDec(dec.d, dec.m, dec.s) ? convertDecToDegrees(dec.sign, dec.d, dec.m, dec.s).toFixed(5) : "—"}°
      </p>

      <button
        onClick={handleSubmit}
        className="w-full bg-blue-600 hover:bg-blue-700 p-2 rounded font-semibold"
      >
        Save Park Position
      </button>

      <div className="space-y-2">
        <button
          onClick={() => handleParkOption("PARK_CURRENT")}
          className="w-full bg-green-600 hover:bg-green-700 p-2 rounded"
        >
          Use Current Position as Park
        </button>
        <button
          onClick={() => handleParkOption("PARK_DEFAULT")}
          className="w-full bg-gray-700 hover:bg-gray-800 p-2 rounded"
        >
          Use Default Park Position
        </button>
      </div>
    </div>
  );
}
