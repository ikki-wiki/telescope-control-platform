import CoordinateSlew from '../components/CoordinateSlew';
import AbortMotion from '../components/AbortMotion';
import ParkUnpark from '../components/ParkUnpark';
import ParkPositionManager from '../components/ParkPositionManager';
import ManualTelescopeMotionControl from '../components/ManualTelescopeMotionControl';
import SlewToObject from '../components/SlewToObject';

export default function Control() {
  return (
    <div className="p-6 space-y-8">

      {/* Slewing */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Slew to Coordinates</h2>
          <CoordinateSlew />
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Slew to Object</h2>
          <SlewToObject />
        </div>

        <div className="space-y-4">
          <AbortMotion />
        </div>
      </section>

      {/* Manual Controls */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold mb-4">Manual Telescope Motion Control</h2>
        <ManualTelescopeMotionControl />
      </section>

      {/* Park Management */}
      <section className="space-y-4">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Park / Unpark Telescope</h2>
          <ParkUnpark />
        </div>
      </section>
    </div>
  );
}
