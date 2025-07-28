import { useState } from 'react';
import DateControl from '../components/DateControl';
import TimeControl from '../components/TimeControl';

export default function Settings() {

  return (
    <div className="flex flex-wrap gap-6 p-6">
      <DateControl />
      <TimeControl />
    </div>
  );
}