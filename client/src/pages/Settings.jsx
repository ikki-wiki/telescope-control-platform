import { useState } from 'react';
import { setDate, setTime } from '../api/telescopeAPI';
import DateControl from '../components/DateControl';
import TimeControl from '../components/TimeControl';

export default function Settings() {

  return (
  <>
    <DateControl />
    <TimeControl />
  </>
  );

}