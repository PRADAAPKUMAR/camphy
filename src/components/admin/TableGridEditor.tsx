import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, Loader2, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

export interface ColumnMeta {
  name: string;
  type: string;
  format: string;
  required: boolean;
  primaryKey: boolean;
  hasDefault: boolean;
}

type Row = Record<string, unknown>;

interface Props {
  table: string;
  columns: ColumnMeta[];
  call: (body: Record<string, unknown>) => Promise<any>;
}

const cellText = (v: unknown) => {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
};

const csvEscape = (v: unknown) => {
  const s = cellText(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const PAGE_SIZE = 200;

const TableGridEditor = ({ table, columns, call }: Props) => {
  const [rows, setRows] = useState<Row[]>([]);
  const [dirty, setDirty] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const pk = useMemo(() => columns.find((c) => c.primaryKey)?.name ?? null, [columns]);

  const load = async (p = page) => {
    setLoading(true);
    try {
      const data = await call({
        action: "rows",
        table,
        limit: PAGE_SIZE,
        offset: p * PAGE_SIZE,
      });
      setRows((data?.rows ?? []) as Row[]);
      setCount(Number(data?.count ?? 0));
      setDirty(new Set());
      setSelected(new Set());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load rows");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(0);
    load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  const edit = (index: number, col: string, value: string) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [col]: value } : r)));
    setDirty((prev) => new Set(prev).add(index));
  };

  const addRow = () => {
    setRows((prev) => {
      const next = [...prev, {} as Row];
      setDirty((d) => new Set(d).add(next.length - 1));
      return next;
    });
  };

  const save = async () => {
    const payload = Array.from(dirty)
      .map((i) => rows[i])
      .filter(Boolean);
    if (!payload.length) return toast.info("Nothing changed");
    setSaving(true);
    try {
      const res = await call({ action: "save", table, rows: payload });
      toast.success(`Saved — ${res?.updated ?? 0} updated, ${res?.inserted ?? 0} added`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const removeSelected = async () => {
    if (!pk) return toast.error("This table has no primary key to delete by");
    const ids = Array.from(selected)
      .map((i) => rows[i]?.[pk])
      .filter((v) => v !== undefined && v !== null && v !== "");
    // New unsaved rows are simply dropped locally.
    const localOnly = Array.from(selected).filter((i) => !rows[i]?.[pk]);
    if (localOnly.length) {
      setRows((prev) => prev.filter((_, i) => !localOnly.includes(i)));
      setSelected(new Set());
      setDirty(new Set());
      if (!ids.length) return;
    }
    if (!ids.length) return;
    try {
      await call({ action: "delete", table, ids });
      toast.success(`Deleted ${ids.length} row${ids.length > 1 ? "s" : ""}`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete");
    }
  };

  const download = async () => {
    try {
      const data = await call({ action: "export", table });
      const cols = (data?.columns ?? columns.map((c) => c.name)) as string[];
      const body = (data?.rows ?? []) as Row[];
      const csv = [
        cols.join(","),
        ...body.map((r) => cols.map((c) => csvEscape(r[c])).join(",")),
      ].join("\n");
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${table}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not export");
    }
  };

  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="border-border/40 font-mono text-xs">
          {table}
        </Badge>
        <span className="text-xs text-muted-foreground">{count} rows</span>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => load()} disabled={loading}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Reload
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={download}>
            <Download className="h-3.5 w-3.5" /> CSV
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={addRow}>
            <Plus className="h-3.5 w-3.5" /> Add row
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-destructive hover:text-destructive"
            onClick={removeSelected}
            disabled={selected.size === 0}
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete ({selected.size})
          </Button>
          <Button size="sm" className="gap-1.5" onClick={save} disabled={saving || dirty.size === 0}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Update ({dirty.size})
          </Button>
        </div>
      </div>

      <div className="overflow-auto rounded-xl border border-border/40" style={{ maxHeight: "60vh" }}>
        <table className="w-full border-collapse text-xs">
          <thead className="sticky top-0 z-10 bg-card">
            <tr>
              <th className="w-9 border-b border-r border-border/40 p-2" />
              {columns.map((c) => (
                <th
                  key={c.name}
                  className="whitespace-nowrap border-b border-r border-border/40 px-2 py-2 text-left font-semibold"
                >
                  {c.name}
                  {c.primaryKey && <span className="ml-1 text-primary">pk</span>}
                  {c.required && !c.hasDefault && !c.primaryKey && (
                    <span className="ml-1 text-destructive">*</span>
                  )}
                  <span className="ml-1 font-normal text-muted-foreground">{c.format || c.type}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={dirty.has(i) ? "bg-primary/5" : undefined}>
                <td className="border-b border-r border-border/40 p-2 text-center">
                  <Checkbox
                    checked={selected.has(i)}
                    onCheckedChange={(v) =>
                      setSelected((prev) => {
                        const next = new Set(prev);
                        v ? next.add(i) : next.delete(i);
                        return next;
                      })
                    }
                  />
                </td>
                {columns.map((c) => (
                  <td key={c.name} className="border-b border-r border-border/40 p-0">
                    <input
                      value={cellText(row[c.name])}
                      onChange={(e) => edit(i, c.name, e.target.value)}
                      placeholder={c.primaryKey ? "auto" : ""}
                      className="w-full min-w-[7rem] bg-transparent px-2 py-1.5 font-mono text-[11px] outline-none focus:bg-primary/10"
                    />
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={columns.length + 1} className="p-4 text-center text-muted-foreground">
                  No rows yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page === 0 || loading}
            onClick={() => {
              const p = page - 1;
              setPage(p);
              load(p);
            }}
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page + 1} of {pages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page + 1 >= pages || loading}
            onClick={() => {
              const p = page + 1;
              setPage(p);
              load(p);
            }}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default TableGridEditor;
