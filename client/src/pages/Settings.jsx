import DateControl from '../components/DateControl';
import TimeControl from '../components/TimeControl';
import SlewRateSelector from '../components/SlewRateSelector';
import ParkPositionManager from '../components/ParkPositionManager';

export default function Settings() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2 mt-2">Telescope Settings</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="min-w-[250px] space-y-4">
          <h2 className="text-xl font-semibold">Set date</h2>
          <DateControl />
        </div>

        <div className="min-w-[250px] space-y-4">
          <h2 className="text-xl font-semibold">Set time</h2>
          <TimeControl />
        </div>

        <div className="min-w-[250px] space-y-4">
          <h2 className="text-xl font-semibold mb-14">Set slew rate</h2>
          <SlewRateSelector />
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Park Position Manager</h2>
        <ParkPositionManager />
      </div>
    </div>
  );
}
