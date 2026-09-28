import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Paper { id: string; syllabus_code: string; total_questions: number; paper_code: string; session: string; year: number }
interface Topic { id: string; topic_code: string; topic_name: string; level: string | null }
interface Mapping { id?: string; question_number: number; start_page: number | string; end_page: number | string; verified: boolean; shared_page_warning: boolean; topic_ids: string[] }

const TheoryMappingEditor = ({ paper, call }: { paper: Paper; call: (body: Record<string, unknown>) => Promise<any> }) => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [rows, setRows] = useState<Mapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    call({ action: "mapping_data", paper_id: paper.id }).then((data) => {
      if (!active) return;
      setTopics(data.topics ?? []);
      const existing = new Map<number, Mapping>((data.mappings ?? []).map((row: Mapping) => [row.question_number, row]));
      setRows(Array.from({ length: paper.total_questions }, (_, index) => existing.get(index + 1) ?? {
        question_number: index + 1, start_page: "", end_page: "", verified: false, shared_page_warning: false, topic_ids: [],
      }));
    }).catch((error) => toast.error(error instanceof Error ? error.message : "Could not load mappings")).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [call, paper.id, paper.total_questions]);

  const groups = useMemo(() => topics.filter((topic) => !topic.level || paper.syllabus_code === "0625" || topic.level.toUpperCase().includes(paper.paper_code.startsWith("9702/4") ? "A LEVEL" : "AS LEVEL")), [paper, topics]);
  const update = (question: number, patch: Partial<Mapping>) => setRows((current) => current.map((row) => row.question_number === question ? { ...row, ...patch } : row));
  const save = async () => {
    const invalid = rows.find((row) => row.verified && (!Number(row.start_page) || Number(row.end_page) < Number(row.start_page) || !row.topic_ids.length));
    if (invalid) return toast.error(`Q${invalid.question_number} needs a valid page range and at least one topic`);
    setSaving(true);
    try {
      await call({ action: "save_mappings", paper_id: paper.id, mappings: rows.filter((row) => Number(row.start_page) > 0).map((row) => ({ ...row, start_page: Number(row.start_page), end_page: Number(row.end_page) })) });
      toast.success("Question mappings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save mappings");
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading mappings</div>;
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><h3 className="font-semibold">Question page and topic mapping</h3><p className="text-xs text-muted-foreground">PDF page numbers include the cover pages.</p></div>
      <Button onClick={save} disabled={saving} className="gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save mappings</Button>
    </div>
    <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
      {rows.map((row) => <div key={row.question_number} className="rounded-lg border border-border/40 p-3">
        <div className="mb-3 flex flex-wrap items-end gap-3">
          <strong className="min-w-10 text-primary">Q{row.question_number}</strong>
          <Label className="space-y-1 text-xs">Start page<Input className="h-8 w-20" type="number" min={1} value={row.start_page} onChange={(event) => update(row.question_number, { start_page: event.target.value })} /></Label>
          <Label className="space-y-1 text-xs">End page<Input className="h-8 w-20" type="number" min={1} value={row.end_page} onChange={(event) => update(row.question_number, { end_page: event.target.value })} /></Label>
          <Label className="flex items-center gap-2 text-xs"><Checkbox checked={row.verified} onCheckedChange={(checked) => update(row.question_number, { verified: checked === true })} />Reviewed</Label>
          <Label className="flex items-center gap-2 text-xs"><Checkbox checked={row.shared_page_warning} onCheckedChange={(checked) => update(row.question_number, { shared_page_warning: checked === true })} />Shared page</Label>
          {row.verified && <CheckCircle2 className="h-4 w-4 text-success" />}
        </div>
        <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">{groups.map((topic) => <Label key={topic.id} className="flex items-start gap-2 rounded-md p-1.5 text-xs hover:bg-muted/30"><Checkbox checked={row.topic_ids.includes(topic.id)} onCheckedChange={(checked) => update(row.question_number, { topic_ids: checked ? [...row.topic_ids, topic.id] : row.topic_ids.filter((id) => id !== topic.id) })} /><span><span className="font-mono text-primary">{topic.topic_code}</span> {topic.topic_name}</span></Label>)}</div>
      </div>)}
    </div>
  </div>;
};

export default TheoryMappingEditor;