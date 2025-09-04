import { motion } from "framer-motion";
import {
  UserCircle,
  Monitor,
  Server,
  Network,
  Telescope,
  ArrowRight,
  ArrowDown
} from "lucide-react";

const steps = [
  {
    icon: <UserCircle className="w-6 h-6" />,
    title: "User",
    desc: "Interacts with the interface to control the observatory",
    color: "bg-blue-500"
  },
  {
    icon: <Monitor className="w-6 h-6" />,
    title: "React Web Client",
    desc: "Frontend that sends commands and shows data",
    color: "bg-green-500"
  },
  {
    icon: <Server className="w-6 h-6" />,
    title: "Flask API",
    desc: "Bridges frontend with INDI by handling requests",
    color: "bg-yellow-500"
  },
  {
    icon: <Network className="w-6 h-6" />,
    title: "INDI Server",
    desc: "Translates commands into device-specific protocol",
    color: "bg-purple-500"
  },
  {
    icon: <Telescope className="w-6 h-6" />,
    title: "Telescope",
    desc: "Receives movement and tracking commands",
    color: "bg-red-500"
  }
];

export function ArchitectureFlow() {
  return (
    <div className="my-12 px-4">
      <h2 className="text-2xl font-semibold mb-6 text-center">
        System Architecture
      </h2>

      {/* Horizontal layout - only after 1420px */}
      <div className="hidden [@media(min-width:1420px)]:flex gap-2 justify-center">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.25 }}
              className={`rounded-lg text-white text-center shadow-md px-4 py-3 w-52 ${step.color}`}
            >
              <div className="flex items-center gap-2 mb-1 justify-center">
                {step.icon}
                <span className="font-semibold">{step.title}</span>
              </div>
              <p className="text-sm opacity-90">{step.desc}</p>
            </motion.div>

            {i < steps.length - 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.25 + 0.2 }}
              >
                <ArrowRight className="w-6 h-6 text-gray-400" />
              </motion.div>
            )}
          </div>
        ))}
      </div>

      {/* Vertical layout - from mobile up to 1419px */}
      <div className="flex flex-col [@media(min-width:1420px)]:hidden items-center gap-2">
        {steps.map((step, i) => (
          <div key={i} className="flex flex-col items-center gap-2 w-full max-w-md">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.25 }}
              className={`rounded-lg text-white shadow-md px-4 py-3 w-full ${step.color}`}
            >
              <div className="flex items-center gap-2 mb-1 justify-center">
                {step.icon}
                <span className="font-semibold">{step.title}</span>
              </div>
              <p className="text-sm opacity-90 text-center">{step.desc}</p>
            </motion.div>

            {i < steps.length - 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.25 + 0.2 }}
              >
                <ArrowDown className="w-5 h-5 text-gray-400" />
              </motion.div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
