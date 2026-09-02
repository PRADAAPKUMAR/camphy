import { useEffect, useState } from "react";

const IST = "Asia/Kolkata";

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: IST,
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const timeFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: IST,
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

const read = () => ({
  date: dateFmt.format(new Date()),
  time: timeFmt.format(new Date()),
});

/** Live Asia/Kolkata date + time. Never uses the device timezone. */
const IstClock = ({ compact = false }: { compact?: boolean }) => {
  const [now, setNow] = useState(read);

  useEffect(() => {
    const id = window.setInterval(() => setNow(read()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (compact) {
    return (
      <span className="whitespace-nowrap text-[11px] font-medium tabular-nums text-muted-foreground">
        {now.time} IST
      </span>
    );
  }

  return (
    <span className="whitespace-nowrap text-[12px] font-medium tabular-nums text-muted-foreground">
      <span className="hidden lg:inline">{now.date} · </span>
      {now.time} IST
    </span>
  );
};

export default IstClock;
