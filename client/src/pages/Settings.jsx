import { useState, useEffect } from "react";
import DateTimeControl from "../components/DateTimeControl";
import SlewRateSelector from "../components/SlewRateSelector";
import FocuserControl from "../components/FocuserControl";
import SiteInfoManager from "../components/SiteInfoManager";

export default function Settings() {
  const cardClasses =
    "border border-gray-400 rounded-2xl p-6 shadow-sm bg-gray-900 " +
    "transition transform hover:bg-gray-800 hover:shadow-lg hover:border-gray-500 hover:scale-[1.02]";

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold mb-4 text-center">Telescope Settings</h1>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className={cardClasses}>
          <h2 className="text-xl font-semibold mb-4">Date and Time</h2>
          <DateTimeControl />
        </div>
        <div className="grid md:grid-rows-1 lg:grid-rows-1 gap-4">
          <div className={cardClasses}>
            <h2 className="text-xl font-semibold mb-4">Slew Rate</h2>
            <SlewRateSelector />
          </div>
          <div className={cardClasses}>
            <h2 className="text-xl font-semibold mb-4">Focuser Control</h2>
            <FocuserControl />
          </div>
        </div>
      </section>

      <section className={`${cardClasses} flex flex-col space-y-6`}>
        <h2 className="text-xl font-semibold">Site</h2>
          <SiteInfoManager />
      </section>
    </div>
  );
}
