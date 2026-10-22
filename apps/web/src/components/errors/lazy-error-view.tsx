"use client";

import dynamic from "next/dynamic";

// Error boundaries ship with every page, so the view itself (icons, buttons, texts) loads only when one is shown.
export const LazyErrorView = dynamic(() => import("./error-view").then((m) => m.ErrorView));
