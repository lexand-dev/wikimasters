import "server-only";
import { Resend } from "resend";

let cachedResend: Resend | null = null;

export function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }

  if (!cachedResend) {
    cachedResend = new Resend(process.env.RESEND_API_KEY);
  }

  return cachedResend;
}

export const resend = getResendClient();
