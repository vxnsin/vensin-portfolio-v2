import { visitorStats } from "@/lib/visits";
import { LiveCounter } from "./LiveCounter";

/** the classic hit counter: a little bezel with six glowing digits, plus today's count in small print. keeps ticking while the page is open. */
export function VisitorCounter() {
  const { total, today } = visitorStats();
  return <LiveCounter total={total} today={today} />;
}
