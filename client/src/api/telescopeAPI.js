const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export async function slewToCoordinates(ra, dec) {
  const res = await fetch(`${BASE_URL}/slew`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ra: ra, dec: dec })
  });
  if (!res.ok) {
    throw new Error('Failed to slew telescope');
  }
  return res.json();
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
  return data.position;
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