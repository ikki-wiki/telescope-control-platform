import { ArchitectureFlow } from "../components/ArchitectureFlow";

export default function Home() {
  return (
    <section className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4 text-center">
        OAUMa Observatory Control System
      </h1>
      <p className="text-lg text-gray-400 text-center mb-8">
        A remote web-based platform for controlling the Meade LX200 telescope at the Observatório Astronómico da Universidade da Madeira.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <Feature icon="🪐" label="Slew to Coordinates" />
        <Feature icon="🔭" label="Monitor Live Telescope Position" />
        <Feature icon="🧭" label="Adjust Slew Speeds" />
        <Feature icon="⏱️" label="Sync Date and Time" />
        <Feature icon="📡" label="Full Remote Access" />
        <Feature icon="🔒" label="Tracking and Safety Controls" />
      </div>

      <ArchitectureFlow />

      <div className="p-4 rounded-md text-sm text-center text-gray-400">
        Developed by Igor Vasconcelos • Universidade da Madeira • 2025
      </div>
    </section>
  );
}

function Feature({ icon, label }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-gray-700 rounded-lg shadow-sm border">
      <span className="text-3xl">{icon}</span>
      <span className="text-lg font-medium">{label}</span>
    </div>
  );
}
