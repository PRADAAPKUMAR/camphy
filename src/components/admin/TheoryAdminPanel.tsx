import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, FileText, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { readFileAsBase64 } from "@/lib/question-images";
import { parseTheoryFilename, THEORY_LEVELS } from "@/lib/theory-filenames";
import { compareSessions } from "@/lib/exam-sessions";

interface TheoryPaperRow {
  id: string;
  level: string;
  paper_code: string;
  session: string;
  year: number;
  component: string;
  total_questions: number;
  question_storage_path: string | null;
  answer_storage_path: string | null;
}

interface ExplanationRow {
  id: string;
  question_number: number;
  part_label: string | null;
  order_index: number;
  explanation: string | null;
  image_url?: string | null;
}

interface Props {
  call: (body: Record<string, unknown>) => Promise<any>;
}

interface PendingFile {
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  message?: string;
}

const TheoryAdminPanel = ({ call }: Props) => {
  const [papers, setPapers] = useState<TheoryPaperRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const [selectedPaper, setSelectedPaper] = useState<string>("");
  const [explanations, setExplanations] = useState<ExplanationRow[]>([]);
  const [form, setForm] = useState({
    id: "",
    question_number: "1",
    part_label: "",
    order_index: "0",
    explanation: "",
  });
  const [image, setImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await call({ action: "list" });
      setPapers((data?.papers ?? []) as TheoryPaperRow[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load theory papers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sortedPapers = useMemo(
    () =>
      [...papers].sort(
        (a, b) =>
          (b.year ?? 0) - (a.year ?? 0) ||
          compareSessions(a.session, b.session) ||
          a.paper_code.localeCompare(b.paper_code),
      ),
    [papers],
  );

  const uploadAll = async () => {
    const ready = pending.filter((p) => parseTheoryFilename(p.file.name));
    if (!ready.length) {
      return toast.error("No filenames matched e.g. 9702_s23_qp_22.pdf");
    }
    setUploading(true);
    setProgress(0);
    let done = 0;

    for (let i = 0; i < pending.length; i++) {
      const item = pending[i];
      if (!parseTheoryFilename(item.file.name)) continue;
      setPending((prev) => prev.map((p, idx) => (idx === i ? { ...p, status: "uploading" } : p)));
      try {
        const data_base64 = await readFileAsBase64(item.file);
        await call({
          action: "upload_pdf",
          filename: item.file.name,
          data_base64,
        });
        setPending((prev) => prev.map((p, idx) => (idx === i ? { ...p, status: "done" } : p)));
      } catch (e) {
        setPending((prev) =>
          prev.map((p, idx) =>
            idx === i
              ? { ...p, status: "error", message: e instanceof Error ? e.message : "Failed" }
              : p,
          ),
        );
      }
      done++;
      setProgress(Math.round((done / ready.length) * 100));
    }

    setUploading(false);
    await refresh();
    toast.success("Upload finished — question papers and answer keys paired by filename");
  };

  const loadExplanations = async (paperId: string) => {
    setSelectedPaper(paperId);
    setExplanations([]);
    setForm({ id: "", question_number: "1", part_label: "", order_index: "0", explanation: "" });
    if (!paperId) return;
    try {
      const data = await call({ action: "list_explanations", paper_id: paperId });
      setExplanations((data?.explanations ?? []) as ExplanationRow[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load explanations");
    }
  };

  const saveExplanation = async () => {
    if (!selectedPaper) return toast.error("Pick a paper first");
    setSaving(true);
    try {
      const image_base64 = image ? await readFileAsBase64(image) : undefined;
      await call({
        action: "save_explanation",
        id: form.id || undefined,
        paper_id: selectedPaper,
        question_number: Number(form.question_number),
        part_label: form.part_label,
        order_index: Number(form.order_index) || 0,
        explanation: form.explanation,
        image_base64,
        image_content_type: image?.type,
      });
      setImage(null);
      toast.success("Explanation saved");
      await loadExplanations(selectedPaper);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const removeExplanation = async (id: string) => {
    try {
      await call({ action: "delete_explanation", id });
      await loadExplanations(selectedPaper);
      toast.success("Explanation deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete");
    }
  };

  const updatePaper = async (paper: TheoryPaperRow, patch: Record<string, unknown>) => {
    try {
      await call({ action: "update_paper", paper_id: paper.id, ...patch });
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update paper");
    }
  };

  const deletePaper = async (paper: TheoryPaperRow) => {
    try {
      await call({ action: "delete_paper", paper_id: paper.id });
      if (selectedPaper === paper.id) setSelectedPaper("");
      await refresh();
      toast.success("Paper deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete paper");
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card space-y-4 rounded-2xl p-5">
        <div>
          <h2 className="text-lg font-bold">Upload theory PDFs</h2>
          <p className="text-sm text-muted-foreground">
            Drop question papers and mark schemes together. Level, session, year and pairing are
            taken from the filename, e.g. <span className="font-mono">9702_s23_qp_22.pdf</span> +{" "}
            <span className="font-mono">9702_s23_ms_22.pdf</span>.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="theory-files">PDF files</Label>
          <Input
            id="theory-files"
            type="file"
            accept="application/pdf"
            multiple
            onChange={(e) =>
              setPending(
                Array.from(e.target.files ?? []).map((file) => ({
                  file,
                  status: "pending" as const,
                })),
              )
            }
          />
        </div>

        {pending.length > 0 && (
          <div className="max-h-64 space-y-1.5 overflow-y-auto rounded-lg border border-border/40 p-2">
            {pending.map((p, idx) => {
              const parsed = parseTheoryFilename(p.file.name);
              return (
                <div key={`${p.file.name}-${idx}`} className="flex items-center gap-2 text-xs">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate font-mono text-muted-foreground">
                    {p.file.name}
                  </span>
                  {parsed ? (
                    <Badge variant="outline" className="border-border/40 text-[10px]">
                      {parsed.level} · {parsed.paper_code} · {parsed.kind === "qp" ? "Questions" : "Answer key"}
                    </Badge>
                  ) : (
                    <span className="text-destructive">Unrecognised filename</span>
                  )}
                  {p.status === "uploading" && <Loader2 className="h-4 w-4 animate-spin" />}
                  {p.status === "done" && <CheckCircle2 className="h-4 w-4 text-success" />}
                  {p.status === "error" && (
                    <span className="text-destructive">{p.message ?? "Failed"}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {uploading && <Progress value={progress} />}

        <Button className="gap-2" onClick={uploadAll} disabled={uploading || !pending.length}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Upload {pending.length || ""} PDFs
        </Button>
      </div>

      <div className="glass-card space-y-3 rounded-2xl p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Theory papers</h2>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        {sortedPapers.length === 0 ? (
          <p className="text-xs text-muted-foreground">No theory papers uploaded yet.</p>
        ) : (
          <div className="space-y-2">
            {sortedPapers.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-border/40 p-2.5 text-xs"
              >
                <span className="font-mono font-semibold">{p.paper_code}</span>
                <span className="text-muted-foreground">
                  {p.session} {p.year}
                </span>
                <Select value={p.level} onValueChange={(level) => updatePaper(p, { level })}>
                  <SelectTrigger className="h-8 w-[130px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {THEORY_LEVELS.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min={1}
                  max={60}
                  defaultValue={p.total_questions}
                  onBlur={(e) => updatePaper(p, { total_questions: Number(e.target.value) })}
                  className="h-8 w-16 text-xs"
                  title="Number of questions"
                />
                <Badge
                  variant="outline"
                  className={`text-[10px] ${p.question_storage_path ? "border-success/40 text-success" : "border-border/40 text-muted-foreground"}`}
                >
                  QP
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${p.answer_storage_path ? "border-success/40 text-success" : "border-border/40 text-muted-foreground"}`}
                >
                  MS
                </Badge>
                <div className="ml-auto flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => loadExplanations(p.id)}
                  >
                    Explanations
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => deletePaper(p)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedPaper && (
        <div className="glass-card space-y-4 rounded-2xl p-5">
          <h2 className="text-sm font-semibold">
            Explanations for {sortedPapers.find((p) => p.id === selectedPaper)?.paper_code}
          </h2>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Question number</Label>
              <Input
                type="number"
                min={1}
                max={60}
                value={form.question_number}
                onChange={(e) => setForm((f) => ({ ...f, question_number: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Part label (e.g. a(ii))</Label>
              <Input
                value={form.part_label}
                onChange={(e) => setForm((f) => ({ ...f, part_label: e.target.value }))}
                placeholder="a(ii)"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Order</Label>
              <Input
                type="number"
                value={form.order_index}
                onChange={(e) => setForm((f) => ({ ...f, order_index: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">
              Explanation (supports LaTeX: $v^2$, $$\frac{"{1}{2}"}mv^2$$)
            </Label>
            <Textarea
              rows={6}
              value={form.explanation}
              onChange={(e) => setForm((f) => ({ ...f, explanation: e.target.value }))}
              placeholder={"Use $ ... $ for inline math and $$ ... $$ for display math."}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Optional diagram</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button className="gap-2" onClick={saveExplanation} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {form.id ? "Update part" : "Add part"}
            </Button>
            {form.id && (
              <Button
                variant="outline"
                onClick={() =>
                  setForm({
                    id: "",
                    question_number: "1",
                    part_label: "",
                    order_index: "0",
                    explanation: "",
                  })
                }
              >
                New part
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {explanations.length === 0 ? (
              <p className="text-xs text-muted-foreground">No explanations for this paper yet.</p>
            ) : (
              explanations.map((row) => (
                <div
                  key={row.id}
                  className="flex items-start gap-2 rounded-xl border border-border/40 p-2.5 text-xs"
                >
                  <span className="font-semibold text-primary">
                    Q{row.question_number}
                    {row.part_label ? ` ${row.part_label}` : ""}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">
                    {row.explanation ?? "—"}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() =>
                      setForm({
                        id: row.id,
                        question_number: String(row.question_number),
                        part_label: row.part_label ?? "",
                        order_index: String(row.order_index),
                        explanation: row.explanation ?? "",
                      })
                    }
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => removeExplanation(row.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TheoryAdminPanel;
