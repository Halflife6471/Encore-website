"use client";

import { useRef, useState } from "react";
import type { Dict } from "@/lib/dictionaries/en";
import { TRUCK_DOC_LIST, type TruckDocType } from "@/lib/marketplace";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { IconCheck } from "../ui";

export type TruckDoc = { id: string; doc_type: TruckDocType; file_name: string; size_bytes: number; storage_path: string };

const MIME = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAX = 10 * 1024 * 1024;
const EXT: Record<string, string> = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const kb = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/**
 * Uploads truck documents straight from the browser to the private "truck-documents" bucket using the
 * signed-in customer's own session. Row-level security allows only that company's administrators to upload
 * and only its members (and staff) to read; the files never become public.
 */
export function TruckDocuments({
  d, truckId, companyId, initial, recommended,
}: { d: Dict; truckId: string; companyId: string; initial: TruckDoc[]; recommended: TruckDocType[] }) {
  const T = d.listings.docs;
  const [docs, setDocs] = useState<TruckDoc[]>(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  const setErr = (type: string, msg?: string) => setErrors((e) => ({ ...e, [type]: msg ?? "" }));

  async function upload(type: TruckDocType, file: File) {
    setErr(type);
    if (!MIME.includes(file.type)) return setErr(type, T.wrongType);
    if (file.size > MAX) return setErr(type, T.tooBig);
    setBusy(type);
    try {
      const supabase = createBrowserSupabase();
      const path = `${companyId}/${truckId}/${type}-${Date.now()}.${EXT[file.type]}`;
      const up = await supabase.storage.from("truck-documents").upload(path, file, { contentType: file.type, upsert: false });
      if (up.error) throw up.error;
      const ins = await supabase
        .from("truck_documents")
        .insert({ truck_id: truckId, doc_type: type, storage_path: path, file_name: file.name.slice(0, 200), mime_type: file.type, size_bytes: file.size })
        .select("id,doc_type,file_name,size_bytes,storage_path")
        .single();
      if (ins.error || !ins.data) {
        await supabase.storage.from("truck-documents").remove([path]);
        throw ins.error ?? new Error("insert failed");
      }
      setDocs((cur) => [...cur, ins.data as TruckDoc]);
    } catch {
      setErr(type, T.failed);
    } finally {
      setBusy(null);
      const el = inputs.current[type];
      if (el) el.value = "";
    }
  }

  async function remove(doc: TruckDoc) {
    setBusy(doc.id);
    try {
      const supabase = createBrowserSupabase();
      const del = await supabase.from("truck_documents").delete().eq("id", doc.id);
      if (del.error) throw del.error;
      await supabase.storage.from("truck-documents").remove([doc.storage_path]);
      setDocs((cur) => cur.filter((x) => x.id !== doc.id));
    } catch {
      setErr(doc.doc_type, T.failed);
    } finally {
      setBusy(null);
    }
  }

  const order = [...recommended, ...TRUCK_DOC_LIST.filter((t) => !recommended.includes(t))];

  return (
    <div>
      <p className="text-muted">{T.intro}</p>
      <p className="mt-1 text-sm text-muted">{T.accepted}</p>
      <ul className="mt-5 space-y-3">
        {order.map((type) => {
          const mine = docs.filter((x) => x.doc_type === type);
          const rec = recommended.includes(type);
          return (
            <li key={type} className={`rounded-2xl border p-4 ${rec ? "border-fg/40 bg-surface" : "border-line bg-surface"}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {T.types[type]}
                    {rec && <span className="chip ml-2 bg-gold !px-2 !py-0.5 text-[10px] text-ongold">{T.recommended}</span>}
                  </p>
                  {mine.length === 0 && <p className="text-sm text-muted">{T.none}</p>}
                </div>
                <div>
                  <input
                    ref={(el) => { inputs.current[type] = el; }}
                    id={`doc-${type}`}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={busy !== null}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(type, f); }}
                  />
                  <label htmlFor={`doc-${type}`} className={`btn btn-outline btn-sm cursor-pointer ${busy !== null ? "pointer-events-none opacity-60" : ""}`}>
                    {busy === type ? T.uploading : mine.length ? T.replace : T.choose}
                  </label>
                </div>
              </div>
              {mine.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {mine.map((doc) => (
                    <li key={doc.id} className="flex items-center gap-3 rounded-xl bg-soft px-3 py-2 text-sm">
                      <span className="grid h-6 w-6 flex-none place-items-center rounded-full bg-gold text-ongold"><IconCheck className="h-3 w-3" /></span>
                      <span className="min-w-0 flex-1 truncate font-medium">{doc.file_name}</span>
                      <span className="flex-none text-muted">{kb(doc.size_bytes)}</span>
                      <button type="button" onClick={() => void remove(doc)} disabled={busy !== null} className="flex-none font-semibold underline decoration-gold decoration-2 underline-offset-4">{T.remove}</button>
                    </li>
                  ))}
                </ul>
              )}
              {errors[type] && <p role="alert" className="mt-2 text-[13px] font-medium text-danger">{errors[type]}</p>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
