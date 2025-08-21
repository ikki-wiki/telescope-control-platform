import React from 'react';

const FULL_CIRCLE = 360;
const TICK_COUNT = 60; // 6-degree tick marks

export default function Compass({ activeDirections = [] }) {
  // Compute direction angle (degrees) from activeDirections
  // Supports combinations like: ['north'], ['north', 'east'] etc.
  const directionToAngle = {
    north: 0,
    'north-east': 45,
    east: 90,
    'south-east': 135,
    south: 180,
    'south-west': 225,
    west: 270,
    'north-west': 315,
  };

  // Determine single combined direction if possible
  const dirSet = new Set(activeDirections);
  let pointerAngle = null;

  if (dirSet.has('north') && dirSet.has('east')) pointerAngle = directionToAngle['north-east'];
  else if (dirSet.has('north') && dirSet.has('west')) pointerAngle = directionToAngle['north-west'];
  else if (dirSet.has('south') && dirSet.has('east')) pointerAngle = directionToAngle['south-east'];
  else if (dirSet.has('south') && dirSet.has('west')) pointerAngle = directionToAngle['south-west'];
  else if (activeDirections.length === 1) pointerAngle = directionToAngle[activeDirections[0]];

  // Generate tick marks
  const ticks = [];
  for (let i = 0; i < TICK_COUNT; i++) {
    const angle = (FULL_CIRCLE / TICK_COUNT) * i;
    const isMajor = angle % 30 === 0;
    const tickLength = isMajor ? 10 : 5;
    const strokeWidth = isMajor ? 2 : 1;
    const x1 = 80 + 70 * Math.cos((angle - 90) * Math.PI / 180);
    const y1 = 80 + 70 * Math.sin((angle - 90) * Math.PI / 180);
    const x2 = 80 + (70 - tickLength) * Math.cos((angle - 90) * Math.PI / 180);
    const y2 = 80 + (70 - tickLength) * Math.sin((angle - 90) * Math.PI / 180);
    ticks.push(
      <line
        key={`tick-${i}`}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="#444"
        strokeWidth={strokeWidth}
      />
    );
  }

  // Cardinal labels
  const labels = [
    { label: 'N', angle: 0 },
    { label: 'NE', angle: 45 },
    { label: 'E', angle: 90 },
    { label: 'SE', angle: 135 },
    { label: 'S', angle: 180 },
    { label: 'SW', angle: 225 },
    { label: 'W', angle: 270 },
    { label: 'NW', angle: 315 },
  ];

  return (
    <svg width={160} height={160} viewBox="0 0 160 160" aria-label="Telescope Movement Compass" role="img">
      <circle cx={80} cy={80} r={75} stroke="#666" strokeWidth={3} fill="#f9fafb" />
      {ticks}
      {labels.map(({ label, angle }) => {
        const x = 80 + 55 * Math.cos((angle - 90) * Math.PI / 180);
        const y = 80 + 55 * Math.sin((angle - 90) * Math.PI / 180) + 6; // +6 for vertical align
        return (
          <text
            key={`label-${label}`}
            x={x}
            y={y}
            fontSize="14"
            fontWeight="bold"
            fill="#222"
            textAnchor="middle"
            style={{ userSelect: 'none', pointerEvents: 'none' }}
          >
            {label}
          </text>
        );
      })}
      {/* Needle */}
      {pointerAngle !== null && (
        <g transform={`rotate(${pointerAngle}, 80, 80)`}>
          {/* Red needle pointing outwards */}
          <line
            x1={80}
            y1={80}
            x2={80}
            y2={20}
            stroke="#d53f3f"
            strokeWidth={3}
            strokeLinecap="round"
          />
          {/* Base circle */}
          <circle cx={80} cy={80} r={7} fill="#d53f3f" />
        </g>
      )}
      {/* Center pivot circle */}
      <circle cx={80} cy={80} r={5} fill="#444" />
    </svg>
  );
}
