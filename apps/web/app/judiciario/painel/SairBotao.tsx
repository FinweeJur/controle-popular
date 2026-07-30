"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { withBasePath } from "@/lib/judiciario/basePath";

export default function SairBotao() {
  const router = useRouter();

  async function sair() {
    await authClient.signOut();
    router.push(withBasePath("/login"));
    router.refresh();
  }

  return (
    <button onClick={sair} className="rounded-md border border-[var(--cp-border)] px-3 py-1.5 text-sm">
      Sair
    </button>
  );
}
