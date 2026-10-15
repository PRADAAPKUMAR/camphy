import { useMemo, useState } from "react";
import { Plus, Trash2, Download, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { STUDY_COLORS, colorHsl, hslToRgb } from "@/lib/study-colors";
import { toast } from "sonner";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface Slot {
  id: string;
  day: string;
  start: string;
  end: string;
  subject: string;
  note: string;
  color: string;
}

const STORAGE_KEY = "physicshq:timetable";

const load = (): Slot[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Slot[]) : [];
  } catch {
    return [];
  }
};

const TimetableScheduler = () => {
  const [studentName, setStudentName] = useState("");
  const [slots, setSlots] = useState<Slot[]>(load);
  const [draft, setDraft] = useState<Omit<Slot, "id">>({
    day: "Monday",
    start: "16:00",
    end: "17:00",
    subject: "",
    note: "",
    color: STUDY_COLORS[0].key,
  });

  const persist = (next: Slot[]) => {
    setSlots(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch { /* storage unavailable */ }
  };

  const addSlot = () => {
    if (!draft.subject.trim()) {
      toast.error("Add a subject or task name");
      return;
    }
    persist([...slots, { ...draft, id: crypto.randomUUID(), subject: draft.subject.trim() }]);
    setDraft((d) => ({ ...d, subject: "", note: "" }));
  };

  const grouped = useMemo(
    () =>
      DAYS.map((day) => ({
        day,
        items: slots
          .filter((s) => s.day === day)
          .sort((a, b) => a.start.localeCompare(b.start)),
      })),
    [slots],
  );

  const totalHours = useMemo(() => {
    const mins = slots.reduce((acc, s) => {
      const [sh, sm] = s.start.split(":").map(Number);
      const [eh, em] = s.end.split(":").map(Number);
      return acc + Math.max(0, eh * 60 + em - (sh * 60 + sm));
    }, 0);
    return (mins / 60).toFixed(1);
  }, [slots]);

  const downloadPdf = async () => {
    if (slots.length === 0) {
      toast.error("Add at least one study slot first");
      return;
    }
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 40;

    // Header band
    doc.setFillColor(...hslToRgb("222 35% 11%"));
    doc.rect(0, 0, pageW, 90, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Weekly Study Timetable", margin, 46);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(190, 205, 230);
    doc.text(
      `${studentName.trim() || "Student"}  ·  ${totalHours} study hours / week  ·  PhysicsHQ`,
      margin,
      68,
    );

    let y = 120;
    doc.setTextColor(30, 30, 40);

    grouped.forEach(({ day, items }) => {
      if (items.length === 0) return;
      if (y > pageH - 110) {
        doc.addPage();
        y = 60;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(20, 25, 40);
      doc.text(day, margin, y);
      y += 10;
      doc.setDrawColor(210, 216, 228);
      doc.line(margin, y, pageW - margin, y);
      y += 14;

      items.forEach((s) => {
        if (y > pageH - 70) {
          doc.addPage();
          y = 60;
        }
        const rgb = hslToRgb(colorHsl(s.color));
        doc.setFillColor(rgb[0], rgb[1], rgb[2]);
        doc.roundedRect(margin, y - 11, 6, 26, 3, 3, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(35, 40, 55);
        doc.text(`${s.start} - ${s.end}`, margin + 16, y + 2);
        doc.text(s.subject, margin + 120, y + 2);
        if (s.note) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(110, 118, 135);
          doc.text(doc.splitTextToSize(s.note, pageW - margin - 300)[0] ?? "", margin + 300, y + 2);
        }
        y += 30;
      });
      y += 12;
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150, 156, 170);
    doc.text("Generated with PhysicsHQ Study Tools", margin, pageH - 24);

    doc.save(`study-timetable${studentName.trim() ? `-${studentName.trim().replace(/\s+/g, "-")}` : ""}.pdf`);
    toast.success("Timetable PDF downloaded");
  };

  return (
    <div className="space-y-6">
      {/* Builder */}
      <div className="glass-card rounded-2xl p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <select
            value={draft.day}
            onChange={(e) => setDraft((d) => ({ ...d, day: e.target.value }))}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            aria-label="Day"
          >
            {DAYS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <Input
            type="time"
            value={draft.start}
            onChange={(e) => setDraft((d) => ({ ...d, start: e.target.value }))}
            aria-label="Start time"
          />
          <Input
            type="time"
            value={draft.end}
            onChange={(e) => setDraft((d) => ({ ...d, end: e.target.value }))}
            aria-label="End time"
          />
          <Input
            value={draft.subject}
            onChange={(e) => setDraft((d) => ({ ...d, subject: e.target.value }))}
            placeholder="Subject / task"
            aria-label="Subject"
          />
          <Input
            value={draft.note}
            onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
            placeholder="Note (optional)"
            aria-label="Note"
          />
          <Button onClick={addSlot} className="gap-2">
            <Plus className="h-4 w-4" /> Add slot
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs text-muted-foreground">Colour:</span>
          {STUDY_COLORS.map((c) => (
            <button
              key={c.key}
              type="button"
              aria-label={c.label}
              onClick={() => setDraft((d) => ({ ...d, color: c.key }))}
              className={`h-6 w-6 rounded-full transition-transform ${draft.color === c.key ? "scale-110 ring-2 ring-offset-2 ring-offset-background" : "opacity-70"}`}
              style={{ background: `hsl(${c.hsl})`, boxShadow: draft.color === c.key ? `0 0 0 2px hsl(${c.hsl})` : undefined }}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          placeholder="Your name (appears on the PDF)"
          className="sm:max-w-xs"
        />
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{totalHours} h / week</span>
          <Button onClick={downloadPdf} className="gap-2">
            <Download className="h-4 w-4" /> Download PDF
          </Button>
          {slots.length > 0 && (
            <Button variant="outline" className="gap-2" onClick={() => persist([])}>
              <Trash2 className="h-4 w-4" /> Clear
            </Button>
          )}
        </div>
      </div>

      {/* Week grid */}
      {slots.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <CalendarDays className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Your week is empty. Add study slots above to build a colourful timetable you can download.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {grouped.map(({ day, items }) => (
            <div key={day} className="glass-card rounded-2xl p-4">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {day}
              </h3>
              {items.length === 0 ? (
                <p className="text-xs text-muted-foreground/70">Rest day</p>
              ) : (
                <ul className="space-y-2">
                  {items.map((s) => {
                    const hsl = colorHsl(s.color);
                    return (
                      <li
                        key={s.id}
                        className="group relative overflow-hidden rounded-xl p-3 pl-4"
                        style={{
                          background: `hsl(${hsl} / 0.12)`,
                          borderLeft: `4px solid hsl(${hsl})`,
                        }}
                      >
                        <p className="font-mono text-[11px] font-semibold" style={{ color: `hsl(${hsl})` }}>
                          {s.start} – {s.end}
                        </p>
                        <p className="text-sm font-semibold leading-tight">{s.subject}</p>
                        {s.note && (
                          <p className="mt-0.5 text-xs text-muted-foreground">{s.note}</p>
                        )}
                        <button
                          onClick={() => persist(slots.filter((x) => x.id !== s.id))}
                          aria-label={`Remove ${s.subject}`}
                          className="absolute right-2 top-2 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TimetableScheduler;