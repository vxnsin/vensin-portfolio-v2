import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/ContactForm";
import { Window } from "@/components/layout/Window";

export const metadata: Metadata = { title: "contact" };

export default function ContactPage() {
  return (
    <div className="grid gap-5">
      <div>
        <h2 className="pixel text-lg text-accent mb-2">contact.</h2>
        <p className="text-xs text-ink-soft">
          questions, collabs, anime recommendations, or just hi. this form lands directly in my discord dms.
        </p>
      </div>
      <Window title="new message" dashed>
        <ContactForm />
      </Window>
      <p className="text-[10px] text-ink-soft">
        prefer discord? my handle is <span className="chip">vxnsin</span>.
      </p>
    </div>
  );
}
