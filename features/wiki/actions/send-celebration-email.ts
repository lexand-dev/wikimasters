"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { articles, user } from "@/db/schema";
import { resend } from "@/lib/resend";

const MILESTONES = [10, 100, 1000, 10000] as const;
const FROM_ADDRESS = "WikiFlow <onboarding@resend.dev>";
const APP_URL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

function formatViews(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return String(n);
}

export async function sendCelebrationEmail({
  articleId,
  pageviews,
}: {
  articleId: number;
  pageviews: number;
}) {
  if (!(MILESTONES as readonly number[]).includes(pageviews)) return;

  const [response] = await db
    .select({ email: user.email, title: articles.title })
    .from(articles)
    .leftJoin(user, eq(articles.authorId, user.id))
    .where(eq(articles.id, articleId));

  const { email, title } = response;

  if (!email) {
    console.log(
      `✘ skipping celebration for article ${articleId} on pageviews ${pageviews}, could not find email in database`,
    );
    return;
  }

  const articleUrl = `${APP_URL}/wiki/${articleId}`;
  const formattedViews = formatViews(pageviews);

  const { error } = await resend.emails.send(
    {
      from: FROM_ADDRESS,
      to: email,
      subject: `🎉 Your article on WikiFlow got ${formattedViews} views!`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
          <h1 style="font-size: 24px; margin: 0 0 16px;">🎉 ${formattedViews} views!</h1>
          <p style="font-size: 16px; line-height: 1.5; color: #333;">
            Your article <strong>${title}</strong> just hit <strong>${pageviews.toLocaleString()} views</strong> on WikiFlow.
          </p>
          <p style="font-size: 16px; line-height: 1.5; color: #333;">
            Keep up the great work — your contribution is making an impact.
          </p>
          <p style="margin: 24px 0 0;">
            <a href="${articleUrl}" style="display: inline-block; background: #111; color: #fff; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-size: 14px;">
              View article →
            </a>
          </p>
        </div>
      `,
    },
    { idempotencyKey: `celebration-email/${articleId}/${pageviews}` },
  );

  if (error) {
    console.error(
      `✘ failed to send celebration email for article ${articleId} on ${pageviews} views: ${error.message}`,
    );
  }
}
