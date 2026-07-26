import "server-only";
import assert from "node:assert";
import { Resend } from "resend";

assert(process.env.RESEND_API_KEY, "You need a RESEND_API_KEY");

export const resend = new Resend(process.env.RESEND_API_KEY);
