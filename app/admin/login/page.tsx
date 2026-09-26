import { redirect } from "next/navigation";
import { adminEnabled, isAdmin } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <div className="max-w-sm mx-auto py-6">
      <h2 className="pixel text-lg text-accent mb-3">who goes there?</h2>
      {adminEnabled() ? (
        <LoginForm />
      ) : (
        <p className="text-xs text-ink-soft">
          admin is disabled: set <span className="chip">ADMIN_PASSWORD</span> in the environment first.
        </p>
      )}
    </div>
  );
}
