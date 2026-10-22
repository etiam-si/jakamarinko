import { notFound } from "next/navigation";

// Any path no page matches: the designed 404 inside the site's header and footer (../not-found.tsx).
export default function CatchAll() {
  notFound();
}
