import { useState } from 'react';
import DateControl from '../components/DateControl';
import TimeControl from '../components/TimeControl';
import SlewRateSelector from '../components/SlewRateSelector';
import ParkPositionManager from '../components/ParkPositionManager';
import SiteInfoManager from '../components/SiteInfoManager';
import DateTimeControl from '../components/DateTimeControl';
import SiteSelector from '../components/SiteSelector';
import LoadSavedConfig from '../components/LoadSavedConfig';

export default function Settings() {
  const [activeSiteId, setActiveSiteId] = useState(1);

  // This callback triggers whenever you select a new site in <SiteSelector />
  function handleSiteChange(siteId) {
    setActiveSiteId(siteId);
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2 mt-2">Telescope Settings</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        <div className="min-w-[250px] space-y-4">
          <h2 className="text-xl font-semibold">Site Information</h2>
          <SiteSelector onSiteChange={handleSiteChange} />
          <SiteInfoManager activeSiteId={activeSiteId} />
        </div>

        <div className="min-w-[250px] space-y-4">
          <h2 className="text-xl font-semibold">Date and time</h2>
          <DateTimeControl />
        </div>

        <div className="min-w-[250px] space-y-4">
          <h2 className="text-xl font-semibold">Slew rate</h2>
          <SlewRateSelector />
        </div>

        {/*<div className="min-w-[250px] space-y-4">
          <h2 className="text-xl font-semibold">Load Saved Configuration</h2>
          <LoadSavedConfig />
        </div>*/}
      </div>
    </div>
  );
}
