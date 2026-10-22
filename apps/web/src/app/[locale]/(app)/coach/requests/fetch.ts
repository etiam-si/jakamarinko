import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ContactRequest, type RequestStatus } from "@jakamarinko/api";
import { api } from "@/lib/api";

// Server only: the api with the coach's session cookie. The layout has already checked the role.
const withCookie = async () => ({ headers: { cookie: (await headers()).get("cookie") ?? "" } });

export async function listRequests(status?: RequestStatus) {
  const res = await api.requests.$get({ query: status ? { status } : {} }, await withCookie());
  if (!res.ok) throw new Error(`GET /api/requests failed: ${res.status}`);
  return ContactRequest.array().parse(await res.json());
}

// A missing or malformed id is a 404 page.
export async function getRequest(id: string) {
  const res = await api.requests[":id"].$get({ param: { id } }, await withCookie());
  if (res.status === 404 || res.status === 400) notFound();
  if (!res.ok) throw new Error(`GET /api/requests/:id failed: ${res.status}`);
  return ContactRequest.parse(await res.json());
}
