import { useState } from 'react';
import DateTimeControl from '../components/DateTimeControl';
import SlewRateSelector from '../components/SlewRateSelector';
import SiteSelector from '../components/SiteSelector';
import SiteInfoManager from '../components/SiteInfoManager';

export default function Settings() {
  const [activeSiteId, setActiveSiteId] = useState(1);

  function handleSiteChange(siteId) {
    setActiveSiteId(siteId);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold mb-4 text-center">Telescope Settings</h1>

      {/* Date/Time & Slew Rate Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-gray-400 rounded-2xl p-6 shadow-sm bg-gray-900">
          <h2 className="text-xl font-semibold mb-4">Date and Time</h2>
          <DateTimeControl />
        </div>
        <div className="border border-gray-400 rounded-2xl p-6 shadow-sm bg-gray-900">
          <h2 className="text-xl font-semibold mb-4">Slew Rate</h2>
          <SlewRateSelector />
        </div>
      </section>

      {/* Site Selection & Site Info Section */}
      <section className="border border-gray-400 rounded-2xl p-6 shadow-sm bg-gray-900 flex flex-col space-y-6">
        <h2 className="text-xl font-semibold">Site</h2>
        <SiteSelector onSiteChange={handleSiteChange} />
        <SiteInfoManager activeSiteId={activeSiteId} />
      </section>
    </div>
  );
}
