import { createServerSupabase } from "@/lib/supabase/server";
import { setInquiryStatus, deleteInquiry } from "@/lib/actions/inquiries";
import type { Inquiry } from "@/lib/types";

const STATUS_LABEL = { new: "Neu", read: "Gelesen", answered: "Beantwortet" } as const;
const STATUS_CLS = { new: "missing", read: "draft", answered: "live" } as const;
const TYPE_LABEL = { booking: "🎤 Booking", comedian: "🎭 Comedian" } as const;

export default async function AdminAnfragenPage() {
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("inquiries").select("*").order("created_at", { ascending: false });
  const inquiries = (data ?? []) as Inquiry[];

  return (
    <>
      <h2>Anfragen ({inquiries.filter((i) => i.status === "new").length} neu)</h2>
      {!inquiries.length && <p>Noch keine Anfragen. Das Universum ist still — noch.</p>}
      {inquiries.map((q) => (
        <details className="card" key={q.id} style={{ marginBottom: 14, padding: 18 }}>
          <summary style={{ cursor: "pointer", fontWeight: 800 }}>
            {TYPE_LABEL[q.type]} · {q.name} · {new Date(q.created_at).toLocaleDateString("de-DE")}{" "}
            <span className={`status ${STATUS_CLS[q.status]}`}>{STATUS_LABEL[q.status]}</span>
          </summary>
          <p>
            <b>E-Mail:</b> <a href={`mailto:${q.email}`}>{q.email}</a>
            {q.phone && <> · <b>Telefon:</b> {q.phone}</>}
          </p>
          {Object.entries(q.payload).map(([k, v]) => v && (
            <p key={k}><b>{k}:</b> {v}</p>
          ))}
          <p style={{ whiteSpace: "pre-wrap" }}>{q.message}</p>
          <div className="actions">
            <form action={setInquiryStatus.bind(null, q.id, "read")}>
              <button className="btn secondary">Gelesen</button>
            </form>
            <form action={setInquiryStatus.bind(null, q.id, "answered")}>
              <button className="btn secondary">Beantwortet</button>
            </form>
            <form action={deleteInquiry.bind(null, q.id)}>
              <button className="btn secondary" style={{ color: "var(--danger)" }}>Löschen</button>
            </form>
          </div>
        </details>
      ))}
    </>
  );
}
