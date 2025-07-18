const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export async function moveTelescope(direction) {
  return fetch(`${BASE_URL}/movement`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command: direction })
  });
}

export async function slewToCoordinates(ra, dec) {
  return fetch(`${BASE_URL}/coordinates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ra: ra, dec: dec })
  });
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

export async function setTime(timeString) {
  const res = await fetch(`${BASE_URL}/time`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ time: timeString }),
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
