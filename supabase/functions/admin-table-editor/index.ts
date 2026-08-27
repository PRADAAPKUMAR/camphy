import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const URL_ = () => Deno.env.get("SUPABASE_URL")!;
const KEY = () => Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = () => createClient(URL_(), KEY());

interface ColumnMeta {
  name: string;
  type: string;
  format: string;
  required: boolean;
  primaryKey: boolean;
  hasDefault: boolean;
}

/** Reads the live PostgREST schema so new tables show up automatically. */
const introspect = async (): Promise<{ name: string; columns: ColumnMeta[] }[]> => {
  const res = await fetch(`${URL_()}/rest/v1/`, {
    headers: { apikey: KEY(), Authorization: `Bearer ${KEY()}` },
  });
  if (!res.ok) throw new Error("Could not read schema");
  const spec = await res.json();
  const defs = (spec?.definitions ?? {}) as Record<string, any>;

  return Object.entries(defs)
    .map(([name, def]) => {
      const required: string[] = def?.required ?? [];
      const props = (def?.properties ?? {}) as Record<string, any>;
      const columns: ColumnMeta[] = Object.entries(props).map(([col, p]) => {
        const description = String(p?.description ?? "");
        return {
          name: col,
          type: String(p?.type ?? "string"),
          format: String(p?.format ?? ""),
          required: required.includes(col),
          primaryKey: /Primary Key/i.test(description),
          hasDefault: p?.default !== undefined || /Default/i.test(description),
        };
      });
      return { name, columns };
    })
    .filter((t) => t.columns.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
};

const coerce = (value: unknown, col: ColumnMeta) => {
  if (value === "" || value === null || value === undefined) return null;
  if (col.type === "integer" || col.type === "number") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  if (col.type === "boolean") {
    if (typeof value === "boolean") return value;
    return String(value).toLowerCase() === "true";
  }
  if (col.format === "jsonb" || col.format === "json") {
    if (typeof value !== "string") return value;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  if (col.type === "array") {
    if (Array.isArray(value)) return value;
    return String(value)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return value;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const passcode = Deno.env.get("ADMIN_UPLOAD_PASSCODE");
    if (!passcode) return json({ error: "Admin passcode is not configured" }, 500);

    const body = await req.json();
    if (typeof body?.passcode !== "string" || body.passcode !== passcode) {
      return json({ error: "Invalid passcode" }, 401);
    }

    const action = body.action;
    const tables = await introspect();

    if (action === "tables") {
      return json({
        tables: tables.map((t) => ({ name: t.name, columns: t.columns })),
      });
    }

    const table = typeof body.table === "string" ? body.table : "";
    const meta = tables.find((t) => t.name === table);
    if (!meta) return json({ error: "Unknown table" }, 400);
    const supabase = admin();
    const pk = meta.columns.find((c) => c.primaryKey)?.name ?? null;

    if (action === "rows") {
      const limit = Math.min(Number(body.limit) || 200, 2000);
      const offset = Math.max(Number(body.offset) || 0, 0);
      let query = supabase.from(table).select("*", { count: "exact" });
      if (pk) query = query.order(pk, { ascending: true });
      const { data, error, count } = await query.range(offset, offset + limit - 1);
      if (error) return json({ error: error.message }, 400);
      return json({ rows: data ?? [], count: count ?? 0, columns: meta.columns, primaryKey: pk });
    }

    if (action === "save") {
      const rows = Array.isArray(body.rows) ? body.rows : [];
      if (!rows.length) return json({ ok: true, updated: 0, inserted: 0 });

      const clean = (row: Record<string, unknown>, keepPk: boolean) => {
        const out: Record<string, unknown> = {};
        for (const col of meta.columns) {
          if (!(col.name in row)) continue;
          if (!keepPk && col.name === pk) continue;
          out[col.name] = coerce(row[col.name], col);
        }
        return out;
      };

      const withPk = rows.filter((r: any) => pk && r?.[pk] !== undefined && r?.[pk] !== null && r?.[pk] !== "");
      const withoutPk = rows.filter((r: any) => !withPk.includes(r));

      if (withPk.length) {
        const { error } = await supabase
          .from(table)
          .upsert(withPk.map((r: any) => clean(r, true)), { onConflict: pk! });
        if (error) return json({ error: error.message }, 400);
      }
      if (withoutPk.length) {
        const { error } = await supabase.from(table).insert(withoutPk.map((r: any) => clean(r, false)));
        if (error) return json({ error: error.message }, 400);
      }
      return json({ ok: true, updated: withPk.length, inserted: withoutPk.length });
    }

    if (action === "delete") {
      if (!pk) return json({ error: "Table has no primary key" }, 400);
      const ids = Array.isArray(body.ids) ? body.ids : [];
      if (!ids.length) return json({ error: "No rows selected" }, 400);
      const { error } = await supabase.from(table).delete().in(pk, ids);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, deleted: ids.length });
    }

    if (action === "export") {
      const out: Record<string, unknown>[] = [];
      for (let from = 0; ; from += 1000) {
        const { data, error } = await supabase.from(table).select("*").range(from, from + 999);
        if (error) return json({ error: error.message }, 400);
        const chunk = data ?? [];
        out.push(...chunk);
        if (chunk.length < 1000 || out.length >= 20000) break;
      }
      return json({ rows: out, columns: meta.columns.map((c) => c.name) });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Internal server error" }, 500);
  }
});
