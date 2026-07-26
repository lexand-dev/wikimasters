"use client";

import { useEffect, useRef, useState } from "react";
import { incrementArticleViews } from "@/features/wiki/actions/pageviews";

export function useArticleViews(articleId: number, initialViews = 0) {
  const [views, setViews] = useState(initialViews);
  const incrementedRef = useRef(false);

  useEffect(() => {
    if (incrementedRef.current) return;
    incrementedRef.current = true;

    let cancelled = false;

    incrementArticleViews(articleId)
      .then((count) => {
        if (!cancelled && count > 0) setViews(count);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [articleId]);

  return views;
}
