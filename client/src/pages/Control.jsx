import CoordinateSlew from '../components/CoordinateSlew';
import ParkUnpark from '../components/ParkUnpark';
import ManualTelescopeMotionControl from '../components/ManualTelescopeMotionControl';

export default function Control() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold mb-4 text-center">Telescope Control</h1>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Slew to Coordinates Card */}
        <div className="rounded-2xl mt-6 shadow-sm bg-gray-900 space-y-4">
          <h2 className="text-xl font-semibold text-center">Move to Coordinates</h2>
          <CoordinateSlew />
        </div>

        {/* Manual Control and Park Management Section */}
        <div className="space-y-6">
          <div className="rounded-2xl mt-6 shadow-sm bg-gray-900 space-y-4">
            <h2 className="text-xl font-semibold text-center">Manual Telescope Movement Control</h2>
            <ManualTelescopeMotionControl />
          </div>

          <div className="rounded-2xl shadow-sm bg-gray-900 space-y-4 mt-11 justify-items-center">
            <ParkUnpark />
          </div>
        </div>
      </section>
    </div>
  );
}
