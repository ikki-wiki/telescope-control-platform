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

export async function getTelescopeInfo(infoType) {
  const res = await fetch(`${BASE_URL}/information`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command: infoType })
  });
  return res.json();
}

export async function setDate(date) {
  const res = await fetch(`${BASE_URL}/setTime`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command: 'date', value: date })
  });
  return res.json();
}

export async function setTime(time) {
  const res = await fetch(`${BASE_URL}/setTime`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command: 'hour', value: time })
  });
  return res.json();
}

export async function getCurrentPosition() {
  const res = await fetch(`${BASE_URL}/currentPosition`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await res.json();
  return data.position;
}
