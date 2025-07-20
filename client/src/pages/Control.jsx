import { useState } from 'react';
import { slewToCoordinates} from '../api/telescopeAPI';
import CoordinateSlew from '../components/CoordinateSlew';

export default function Control() {

  const handleSlew = (ra, dec) => slewToCoordinates(ra, dec);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Telescope Control</h1>

      <div>
        <CoordinateSlew onSlew={handleSlew} />
      </div>
    </div>
  );
}