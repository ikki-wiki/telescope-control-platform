import * as Tooltip from "@radix-ui/react-tooltip";

export default function TooltipWrapper({ children, content, side = "top" }) {
  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          {children}
        </Tooltip.Trigger>
        <Tooltip.Content
          side={side}
          className="z-50 rounded-lg bg-gray-800 text-white text-sm px-3 py-2 shadow-lg max-w-xs text-center"
        >
          {content}
          <Tooltip.Arrow className="fill-gray-800" />
        </Tooltip.Content>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
