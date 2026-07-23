import "server-only";

import { headers } from "next/headers";
import { auth } from "./auth";

export type Session = typeof auth.$Infer.Session;

export const getSession = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session ?? null;
};
