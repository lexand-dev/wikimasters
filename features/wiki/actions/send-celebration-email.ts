"use server";

import { render } from "@react-email/render";
import { eq } from "drizzle-orm";
import React from "react";
import { db } from "@/db";
import { articles, user } from "@/db/schema";
import CelebrationTemplate from "@/features/wiki/emails/celebration-template";
import { getResendClient } from "@/lib/resend";

const MILESTONES = [10, 100, 1000, 10000] as const;
const FROM_ADDRESS = "WikiFlow <onboarding@resend.dev>";
const APP_URL = process.env.VERCEL_URL ?? "http://localhost:3000";

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
    .select({ email: user.email, title: articles.title, name: user.name })
    .from(articles)
    .leftJoin(user, eq(articles.authorId, user.id))
    .where(eq(articles.id, articleId));

  const { email, title, name } = response;

  if (!email) {
    console.log(
      `✘ skipping celebration for article ${articleId} on pageviews ${pageviews}, could not find email in database`,
    );
    return;
  }

  const articleUrl = `${APP_URL}/wiki/${articleId}`;
  const formattedViews = formatViews(pageviews);

  const html = await render(
    React.createElement(CelebrationTemplate, {
      name: name ?? undefined,
      pageviews,
      articleTitle: title ?? undefined,
      articleUrl,
    }),
  );

  const resend = getResendClient();

  if (!resend) {
    console.log(
      `✘ skipping celebration for article ${articleId} on pageviews ${pageviews}, RESEND_API_KEY is not configured`,
    );
    return;
  }

  const { error } = await resend.emails.send(
    {
      from: FROM_ADDRESS,
      to: email,
      subject: `🎉 Your article on WikiFlow got ${formattedViews} views!`,
      html,
    },
    { idempotencyKey: `celebration-email/${articleId}/${pageviews}` },
  );

  if (error) {
    console.error(
      `✘ failed to send celebration email for article ${articleId} on ${pageviews} views: ${error.message}`,
    );
  }
}
