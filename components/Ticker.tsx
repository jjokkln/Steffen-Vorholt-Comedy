import { getActiveOneLiners } from "@/lib/data";

export default async function Ticker() {
  const oneLiners = await getActiveOneLiners();
  if (oneLiners.length === 0) return null;

  const content = oneLiners.map((line) => `★ ${line.text}`).join("   ");

  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker-track">
        <span>{content}</span>
        <span>{content}</span>
      </div>
    </div>
  );
}
