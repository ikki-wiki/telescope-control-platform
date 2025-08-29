import React from "react";

const FULL_CIRCLE = 360;
const TICK_COUNT = 60; // 6-degree tick marks

// Mapping to match manual telescope behavior: east <-> west reversed
const MANUAL_DIR_MAP = {
  north: "north",
  south: "south",
  east: "west", // reverse
  west: "east", // reverse
};

export default function Compass({ activeDirections = [] }) {
  const directionToAngle = {
    north: 0,
    "north-east": 45,
    east: 90,
    "south-east": 135,
    south: 180,
    "south-west": 225,
    west: 270,
    "north-west": 315,
  };

  const mappedDirections = activeDirections.map(
    (d) => MANUAL_DIR_MAP[d] || d
  );

  const dirSet = new Set(mappedDirections);
  let pointerAngle = null;

  if (dirSet.has("north") && dirSet.has("east"))
    pointerAngle = directionToAngle["north-east"];
  else if (dirSet.has("north") && dirSet.has("west"))
    pointerAngle = directionToAngle["north-west"];
  else if (dirSet.has("south") && dirSet.has("east"))
    pointerAngle = directionToAngle["south-east"];
  else if (dirSet.has("south") && dirSet.has("west"))
    pointerAngle = directionToAngle["south-west"];
  else if (mappedDirections.length === 1)
    pointerAngle = directionToAngle[mappedDirections[0]];

  // Generate tick marks
  const ticks = [];
  for (let i = 0; i < TICK_COUNT; i++) {
    const angle = (FULL_CIRCLE / TICK_COUNT) * i;
    const isMajor = angle % 45 === 0;
    const tickLength = isMajor ? 12 : 6;
    const strokeWidth = isMajor ? 2 : 1;
    const x1 = 80 + 68 * Math.cos((angle - 90) * Math.PI / 180);
    const y1 = 80 + 68 * Math.sin((angle - 90) * Math.PI / 180);
    const x2 = 80 + (68 - tickLength) * Math.cos((angle - 90) * Math.PI / 180);
    const y2 = 80 + (68 - tickLength) * Math.sin((angle - 90) * Math.PI / 180);
    ticks.push(
      <line
        key={`tick-${i}`}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="#333"
        strokeWidth={strokeWidth}
      />
    );
  }

  // Cardinal labels
  const labels = [
    { label: "N", angle: 0 },
    { label: "NE", angle: 45 },
    { label: "E", angle: 90 },
    { label: "SE", angle: 135 },
    { label: "S", angle: 180 },
    { label: "SW", angle: 225 },
    { label: "W", angle: 270 },
    { label: "NW", angle: 315 },
  ];

  return (
    <svg
      width={200}
      height={200}
      viewBox="0 0 160 160"
      aria-label="Telescope Movement Compass"
      role="img"
    >
      {/* Outer metallic ring */}
      <circle
        cx={80}
        cy={80}
        r={78}
        stroke="url(#outerRingGradient)"
        strokeWidth={6}
        fill="#f9fafb"
      />
      {/* Inner decorative ring */}
      <circle
        cx={80}
        cy={80}
        r={72}
        stroke="#999"
        strokeWidth={1.5}
        fill="none"
      />

      {/* Tick marks */}
      {ticks}

      {/* Labels */}
      {labels.map(({ label, angle }) => {
        const x = 80 + 45 * Math.cos((angle - 90) * Math.PI / 180);
        const y = 80 + 45 * Math.sin((angle - 90) * Math.PI / 180) + 5;
        return (
          <text
            key={`label-${label}`}
            x={x}
            y={y}
            fontSize="14"
            fontWeight="bold"
            fill="#222"
            textAnchor="middle"
            style={{ userSelect: "none", pointerEvents: "none" }}
          >
            {label}
          </text>
        );
      })}

      {/* Needle */}
      {pointerAngle !== null && (
        <g transform={`rotate(${pointerAngle}, 80, 80)`}>
          <line
            x1={80}
            y1={80}
            x2={80}
            y2={20}
            stroke="#d53f3f"
            strokeWidth={3}
            strokeLinecap="round"
          />
          <circle cx={80} cy={80} r={7} fill="#d53f3f" />
        </g>
      )}

      {/* Center knob */}
      <circle cx={80} cy={80} r={5} fill="#444" />

      {/* Gradients */}
      <defs>
        <radialGradient id="outerRingGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#bbb" />
          <stop offset="100%" stopColor="#666" />
        </radialGradient>
      </defs>
    </svg>
  );
}
