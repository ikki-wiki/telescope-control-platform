import { useState } from 'react';
import CoordinateSlew from '../components/CoordinateSlew';
import AbortMotion from '../components/AbortMotion';
import ParkUnpark from '../components/ParkUnpark';
import ParkPositionManager from '../components/ParkPositionManager';
import SlewToObject from '../components/SlewToObject';

export default function Control() {

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Telescope Control</h1>

      <div>
        {/*<CoordinateSlew />
        <AbortMotion />
        <section className="space-y-6">
          <ParkUnpark />
          <ParkPositionManager />
        </section>*/}
        <SlewToObject />
      </div>
    </div>
  );
}