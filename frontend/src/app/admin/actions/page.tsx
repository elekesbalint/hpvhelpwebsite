"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

type AdminAction = Database["public"]["Tables"]["admin_actions"]["Row"];

export default function AdminActionsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actions, setActions] = useState<AdminAction[]>([]);
  const [search, setSearch] = useState("");
  const [actionTypeFilter, setActionTypeFilter] = useState("all");
  const [entityTypeFilter, setEntityTypeFilter] = useState("all");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: actionsError } = await supabase
      .from("admin_actions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (actionsError) { setError(actionsError.message); setLoading(false); return; }
    setActions(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

  const actionTypes = useMemo(() => Array.from(new Set(actions.map((a) => a.action_type))).sort(), [actions]);
  const entityTypes = useMemo(() => Array.from(new Set(actions.map((a) => a.entity_type))).sort(), [actions]);

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return actions.filter((a) => {
      if (actionTypeFilter !== "all" && a.action_type !== actionTypeFilter) return false;
      if (entityTypeFilter !== "all" && a.entity_type !== entityTypeFilter) return false;
      if (!kw) return true;
      const hay = `${a.id} ${a.admin_user_id} ${a.action_type} ${a.entity_type} ${a.entity_id} ${JSON.stringify(a.meta ?? {})}`.toLowerCase();
      return hay.includes(kw);
    });
  }, [actions, actionTypeFilter, entityTypeFilter, search]);

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Admin</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Audit log</h1>
        <p className="mt-1 text-sm text-red-950/60">Admin műveletek és változások naplója.</p>
      </div>

      {error ? <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm font-medium text-rose-700">{error}</div> : null}

      <div className="flex flex-wrap gap-3 rounded-2xl border border-brand-100 bg-white p-4 shadow-sm">
        <div className="flex flex-1 min-w-48 items-center gap-2 rounded-xl border border-brand-200 bg-white px-3 py-2 transition focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-100">
          <svg className="h-4 w-4 shrink-0 text-brand-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Keresés id, user, action, entity, meta alapján..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-red-950/40"
          />
        </div>
        <select
          value={actionTypeFilter}
          onChange={(e) => setActionTypeFilter(e.target.value)}
          className="rounded-xl border border-brand-200 px-3 py-2 text-sm outline-none transition focus:border-brand-600"
        >
          <option value="all">Összes action_type</option>
          {actionTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          value={entityTypeFilter}
          onChange={(e) => setEntityTypeFilter(e.target.value)}
          className="rounded-xl border border-brand-200 px-3 py-2 text-sm outline-none transition focus:border-brand-600"
        >
          <option value="all">Összes entity_type</option>
          {entityTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="rounded-2xl border border-brand-100 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-brand-50 bg-brand-50/30">
                  <th className="p-4 text-left font-bold uppercase tracking-wider text-xs text-brand-900">Dátum</th>
                  <th className="p-4 text-left font-bold uppercase tracking-wider text-xs text-brand-900">Admin</th>
                  <th className="p-4 text-left font-bold uppercase tracking-wider text-xs text-brand-900">Action type</th>
                  <th className="p-4 text-left font-bold uppercase tracking-wider text-xs text-brand-900">Entity</th>
                  <th className="p-4 text-left font-bold uppercase tracking-wider text-xs text-brand-900">Entity ID</th>
                  <th className="p-4 text-left font-bold uppercase tracking-wider text-xs text-brand-900">Meta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-sm text-red-950/50">Nincs találat.</td>
                  </tr>
                ) : (
                  filtered.map((a) => (
                    <tr key={a.id} className="align-top transition hover:bg-brand-50/30">
                      <td className="p-4 whitespace-nowrap text-red-950/70">{new Date(a.created_at).toLocaleString("hu-HU")}</td>
                      <td className="p-4 font-mono text-xs text-red-950/50">{a.admin_user_id.slice(0, 8)}…</td>
                      <td className="p-4">
                        <span className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-900">{a.action_type}</span>
                      </td>
                      <td className="p-4 font-semibold text-slate-900">{a.entity_type}</td>
                      <td className="p-4 font-mono text-xs text-red-950/50">{a.entity_id.slice(0, 8)}…</td>
                      <td className="p-4">
                        <pre className="max-w-xs overflow-auto rounded-xl border border-brand-100 bg-brand-50/30 p-2.5 text-[11px] text-red-950/70">
                          {JSON.stringify(a.meta ?? {}, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
