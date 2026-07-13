interface StatusPillProps {
  status: "locked" | "unlocked";
}

export function StatusPill({ status }: StatusPillProps) {
  const isLocked = status === "locked";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isLocked
          ? "bg-red-900/10 text-red-800"
          : "bg-teal-900/10 text-teal-800"
      }`}
    >
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${
          isLocked ? "bg-red-800" : "bg-teal-600"
        }`}
      />
      {isLocked ? "Locked" : "Unlocked"}
    </span>
  );
}
