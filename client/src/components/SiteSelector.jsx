import { useState, useEffect } from 'react';
import { getSiteSelection, setSiteSelection, getSiteName, setSiteName } from '../api/telescopeAPI';
import { toast } from 'react-hot-toast';

export default function SiteSelector({ onSiteChange }) {
  const [sites, setSites] = useState([]); // Will get actual sites from HC/INDI
  const [activeSiteId, setActiveSiteId] = useState(null);
  const [siteName, setSiteNameLocal] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch sites info and active status from backend
  async function refreshSitesAndName(siteIdToSelect = null) {
    setIsLoading(true);
    try {
      const selectionData = await getSiteSelection();
      if (
        selectionData.status === 'success' &&
        Array.isArray(selectionData.sites)
      ) {
        // Only consider the first 3 slots (matching persistent HC sites)
        const realSites = selectionData.sites.slice(0, 3);
        setSites(realSites);

        // Figure out which is active; fallback to provided arg if necessary
        let active = realSites.find(s => s.state === 'On');
        if (!active && siteIdToSelect !== null) {
          active = realSites.find(s => s.id === siteIdToSelect);
        }
        setActiveSiteId(active ? active.id : realSites[0]?.id);

        if (active && onSiteChange) onSiteChange(active.id);

        // Get current name for the selected site
        const nameData = await getSiteName();
        if (nameData.status === 'success') setSiteNameLocal(nameData.name || '');
      }
    } catch (error) {
      toast.error('Failed to fetch site selection or name');
      console.error(error);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    refreshSitesAndName();
    // Optionally, refetch whenever parent tells us site changed
    // If you want more immediate updates: [onSiteChange, activeSiteId]
  }, [onSiteChange]);

  const handleSiteChange = async (siteId) => {
    setIsLoading(true);
    try {
      await setSiteSelection(siteId);
      setActiveSiteId(siteId);
      if (onSiteChange) onSiteChange(siteId);
      // Immediately refresh sites & name to sync UI with HC
      await refreshSitesAndName(siteId);
      toast.success(`Switched to site`);
    } catch (error) {
      toast.error('Failed to switch sites');
      console.error(error);
    }
    setIsLoading(false);
  };

  const handleNameChange = e => setSiteNameLocal(e.target.value);

  const handleSaveName = async () => {
    setIsLoading(true);
    try {
      await setSiteName(siteName);
      toast.success('Site name updated');
      // Refresh name from HC after update
      await refreshSitesAndName(activeSiteId);
    } catch (error) {
      toast.error('Failed to update site name');
      console.error(error);
    }
    setIsLoading(false);
  };

  return (
    <section className="w-full mb-6">
      <div className="mb-4">
        <strong>Choose Active Site:</strong>
        <div className="flex gap-4 mt-2">
          {sites.map(site => (
            <label key={site.id} className="inline-flex items-center cursor-pointer">
              <input
                type="radio"
                name="siteSelection"
                value={site.id}
                checked={site.id === activeSiteId}
                disabled={isLoading}
                onChange={() => handleSiteChange(site.id)}
                className="mr-2"
              />
              {site.label || site.name || `Site ${site.id}`}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="siteName" className="block text-sm font-medium mb-1">
          Site Name
        </label>
        <input
          type="text"
          id="siteName"
          value={siteName}
          onChange={handleNameChange}
          disabled={isLoading}
          placeholder="Enter site name"
          className="border border-gray-300 rounded px-3 py-2 w-full mb-2 text-sm text-white"
        />
        <button
          onClick={handleSaveName}
          disabled={isLoading}
          className={`w-full ${isLoading ? 'bg-gray-500' : 'bg-blue-600 hover:bg-blue-700'} text-white font-semibold rounded py-2 px-4 transition`}
        >
          {isLoading ? 'Saving...' : 'Save site name'}
        </button>
      </div>
    </section>
  );
}
