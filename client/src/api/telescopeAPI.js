const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export async function slewToCoordinates(ra, dec, objectName) {
  const response = await fetch(`${BASE_URL}/slew`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ra, dec, objectName }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to slew telescope');
  }

  return response.json(); // or return something if needed
}

export async function syncToCoordinates(ra, dec) {
  const response = await fetch(`${BASE_URL}/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ra, dec }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to sync telescope');
  }

  return response.json(); // or return something if needed
}

export async function slewToObject(objectName) {
  const res = await fetch(`${BASE_URL}/slew-object`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ object: objectName })
  });
  if (!res.ok) {
    throw new Error('Failed to slew telescope to object');
  }
  return res.json();
}

export async function resolveObject(objectName) {
  const res = await fetch(`${BASE_URL}/resolve-object`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ object: objectName })
  });
  if (!res.ok) {
    throw new Error('Failed to resolve object');
  }
  return res.json();
}

export async function getUTCTime() {
  const res = await fetch(`${BASE_URL}/time/utc`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) {
    throw new Error('Failed to fetch UTC time');
  }
  return res.json();
}

export async function setUTCTime(utcTime) {
  const res = await fetch(`${BASE_URL}/time/utc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date: utcTime.date, time: utcTime.time, offset: utcTime.offset }),
  });
  if (!res.ok) {
    throw new Error('Failed to set UTC time');
  }
  return res.json();
}

export async function getDate() {
  const res = await fetch(`${BASE_URL}/date`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) {
    throw new Error('Failed to fetch telescope date');
  }
  return res.json();
}

export async function setDate(dateString) {
  const res = await fetch(`${BASE_URL}/date`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date: dateString }),
  });
  if (!res.ok) {
    throw new Error('Failed to set telescope date');
  }
  return res.json();
}

export async function getTime() {
  const res = await fetch(`${BASE_URL}/time`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) {
    throw new Error('Failed to fetch telescope time');
  }
  return res.json();
}

export async function setTime(time, offset) {
  const res = await fetch(`${BASE_URL}/time`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ time: time, offset: offset }),
  });
  if (!res.ok) {
    throw new Error('Failed to set telescope time');
  }
  return res.json();
}

export async function getTelescopeCoordinates() {
  const res = await fetch(`${BASE_URL}/coordinates`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await res.json();
  return data;
}

export async function abortMotion() {
  const res = await fetch(`${BASE_URL}/abort`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) {
    throw new Error('Failed to abort telescope motion');
  }
  return res.json();
}

export async function parkTelescope() {
  const res = await fetch(`${BASE_URL}/park`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) {
    throw new Error('Failed to park telescope');
  }
  return res.json();
}

export async function unparkTelescope() {
  const res = await fetch(`${BASE_URL}/unpark`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) {
    throw new Error('Failed to unpark telescope');
  }
  return res.json();
}

export async function getTelescopeParkingStatus() {
  const res = await fetch(`${BASE_URL}/parking-status`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) {
    throw new Error('Failed to get telescope parking status');
  }
  const data = await res.json();
  return data.status;
}

export async function getParkPosition() {
  const res = await fetch(`${BASE_URL}/park-position`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) {
    throw new Error('Failed to fetch park position');
  }
  return res.json();
}

export async function setParkPosition(ra, dec) {
  const res = await fetch(`${BASE_URL}/park-position`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ra, dec }),
  });
  if (!res.ok) throw new Error('Failed to set park position');
}

export async function setParkOption(option) {
  const res = await fetch(`${BASE_URL}/park-option`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ option }),
  });
  if (!res.ok) throw new Error('Failed to set park option');
}

export async function moveTelescope(direction) {
  const res = await fetch(`${BASE_URL}/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ direction }),
  });
  if (!res.ok) {
    throw new Error(`Failed to move telescope ${direction}`);
  }
  return res.json();
}

export async function getTrackingState() {
  const res = await fetch(`${BASE_URL}/track-state`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) {
    throw new Error('Failed to fetch tracking state');
  }
  const data = await res.json();
  return data.isTracking; 
}

export async function setTrackingState(state) {
  const res = await fetch(`${BASE_URL}/track-state`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ state }),  
  });
  if (!res.ok) {
    throw new Error('Failed to set tracking state');
  }
  return res.json();
}

export async function getSlewRate() {
  const res = await fetch(`${BASE_URL}/slew-rate`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to fetch slew rates");
  return await res.json();
}

export async function setSlewRate(rateName) {
  const res = await fetch(`${BASE_URL}/slew-rate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rate: rateName }),
  });
  if (!res.ok) throw new Error("Failed to set slew rate");
  return await res.json();
}

export async function getSiteInfo() {
  const res = await fetch(`${BASE_URL}/site`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to fetch site info');
  return await res.json();
}

export async function setSiteInfo(site) {
  const res = await fetch(`${BASE_URL}/site`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(site),
  });
  if (!res.ok) throw new Error('Failed to update site info');
  return await res.json();
}

export async function loadSavedConfig() {
  const res = await fetch(`${BASE_URL}/config/load`, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
  if (!res.ok) throw new Error('Failed to load saved config');
  return res.json();
}

export async function getFocuserSpeed() {
  const res = await fetch(`${BASE_URL}/focuser/speed`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to fetch focuser speed');
  return res.json();
}

export async function setFocuserSpeed(speed) {
  const res = await fetch(`${BASE_URL}/focuser/speed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ speed }),
  });
  if (!res.ok) throw new Error('Failed to set focuser speed');
  return res.json();
}

export async function getFocuserTimer() {
  const res = await fetch(`${BASE_URL}/focuser/timer`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to fetch focuser timer');
  return res.json();
}

export async function setFocuserTimer(timer) {
  const res = await fetch(`${BASE_URL}/focuser/timer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ timer }),
  });
  if (!res.ok) throw new Error('Failed to set focuser timer');
  return res.json();
}

export async function setFocuserMotion(direction) {
  const res = await fetch(`${BASE_URL}/focuser/motion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ direction }),
  });
  if (!res.ok) throw new Error('Failed to set focuser motion');
  return res.json();
}

export async function abortFocuserMotion(abort) {
  const res = await fetch(`${BASE_URL}/focuser/abort`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ abort }),
  });
  if (!res.ok) throw new Error('Failed to abort focuser motion');
  return res.json();
}
