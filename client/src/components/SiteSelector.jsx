import { useState, useEffect } from 'react';
import { getSiteSelection, setSiteSelection, getSiteName, setSiteName } from '../api/telescopeAPI';
import { toast } from 'react-hot-toast';

export default function SiteSelector({ onSiteChange }) {
  const [sites, setSites] = useState([
    { id: 1, label: 'Site 1', active: false },
    { id: 2, label: 'Site 2', active: false },
    { id: 3, label: 'Site 3', active: false },
    { id: 4, label: 'Site 4', active: false },
  ]);
  const [siteName, setSiteNameLocal] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch current selected site and name on mount
  useEffect(() => {
    const fetchSiteData = async () => {
      try {
        const selectionData = await getSiteSelection(); // { status, sites: [{id, state}] }
        const nameData = await getSiteName(); // { status, name }

        if (selectionData.status === 'success' && Array.isArray(selectionData.sites)) {
          setSites(prevSites =>
            prevSites.map(site => {
              const found = selectionData.sites.find(s => s.id === site.id);
              return { ...site, active: found ? found.state === 'On' : false };
            })
          );

          // Inform parent of current active site id
          const activeSite = selectionData.sites.find(s => s.state === 'On');
          if (activeSite && onSiteChange) {
            onSiteChange(activeSite.id);
          }
        }

        if (nameData.status === 'success') {
          setSiteNameLocal(nameData.name || '');
        }
      } catch (error) {
        toast.error("Failed to fetch site selection or name");
        console.error(error);
      }
    };

    fetchSiteData();
  }, [onSiteChange]);

  // Handle site radio change
  const handleSiteChange = async (siteId) => {
    setIsLoading(true);
    try {
      await setSiteSelection(siteId);

      setSites(prevSites =>
        prevSites.map(site => ({
          ...site,
          active: site.id === siteId,
        }))
      );

      if (onSiteChange) {
        onSiteChange(siteId);
      }

      toast.success(`Switched to Site ${siteId}`);
    } catch (error) {
      toast.error("Failed to update site selection");
      console.error(error);
    }
    setIsLoading(false);
  };

  // Handle site name change input locally
  const handleNameChange = (e) => {
    setSiteNameLocal(e.target.value);
  };

  // Save site name to device
  const handleSaveName = async () => {
    setIsLoading(true);
    try {
      await setSiteName(siteName);
      toast.success("Site name updated");
    } catch (error) {
      toast.error("Failed to update site name");
      console.error(error);
    }
    setIsLoading(false);
  };

  return (
    <section className="w-full mb-6">
      <div className="mb-4">
        <strong>Choose Active Site:</strong>
        <div className="flex gap-4 mt-2">
          {sites.map((site) => (
            <label key={site.id} className="inline-flex items-center cursor-pointer">
              <input
                type="radio"
                name="siteSelection"
                value={site.id}
                checked={site.active}
                disabled={isLoading}
                onChange={() => handleSiteChange(site.id)}
                className="mr-2"
              />
              {site.label}
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
          className="border border-gray-300 rounded px-3 py-2 w-full mb-2 text-sm text-black"
        />
        <button
          onClick={handleSaveName}
          disabled={isLoading}
          className={`w-full ${isLoading ? 'bg-gray-500' : 'bg-blue-600 hover:bg-blue-700'} text-white font-semibold rounded py-2 px-4 transition`}
        >
          {isLoading ? 'Saving...' : 'Save Site Name'}
        </button>
      </div>
    </section>
  );
}
