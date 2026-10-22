"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";
import {
  ApiErrorBody,
  Availability,
  AvailabilityException,
  type AvailabilityInput,
  CoachBooking,
  type ExceptionInput,
  Location,
  Slot,
} from "@jakamarinko/api";
import { api } from "@/lib/api";

// A failed api call, with the api's error code (e.g. not_a_coach, slot_taken).
export class ApiFailure extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

async function read<S extends z.ZodType>(res: Response, schema: S): Promise<z.infer<S>> {
  if (!res.ok) {
    const body = ApiErrorBody.safeParse(await res.json().catch(() => null));
    throw new ApiFailure(body.success ? body.data.error.code : "unknown");
  }
  return schema.parse(await res.json());
}

async function done(res: Response) {
  if (!res.ok) await read(res, ApiErrorBody);
}

// coachId: whose calendar (T10's switcher, ?coach=); undefined is the signed-in coach's own.
const keys = {
  bookings: (coachId: string | undefined, from: string, to: string) => ["coach-booking", coachId, "bookings", from, to],
  availability: (coachId: string | undefined) => ["coach-booking", coachId, "availability"],
  exceptions: (coachId: string | undefined) => ["coach-booking", coachId, "exceptions"],
};

export const useBookings = (coachId: string | undefined, from: string, to: string) =>
  useQuery({
    queryKey: keys.bookings(coachId, from, to),
    queryFn: async () => read(await api.booking.coach.bookings.$get({ query: { coachId, from, to } }), CoachBooking.array()),
    retry: false,
  });

export const useLocations = () =>
  useQuery({
    queryKey: ["coach-booking", "locations"],
    queryFn: async () => read(await api.booking.coach.locations.$get(), Location.array()),
    staleTime: Infinity,
  });

export const useAvailability = (coachId: string | undefined) =>
  useQuery({
    queryKey: keys.availability(coachId),
    queryFn: async () => read(await api.booking.coach.availability.$get({ query: { coachId } }), Availability.array()),
    retry: false,
  });

export const useExceptions = (coachId: string | undefined) =>
  useQuery({
    queryKey: keys.exceptions(coachId),
    queryFn: async () => read(await api.booking.coach.exceptions.$get({ query: { coachId } }), AvailabilityException.array()),
    retry: false,
  });

// Free times a booking can move to: its coach, its length, no minimum notice.
export const useRescheduleSlots = (bookingId: string, from: string, to: string) =>
  useQuery({
    queryKey: ["coach-booking", "reschedule", bookingId, from, to],
    queryFn: async () =>
      read(await api.booking.coach.bookings[":id"].slots.$get({ param: { id: bookingId }, query: { from, to } }), Slot.array()),
    staleTime: 0,
  });

// Every change refreshes all coach-booking data: lists are small and a change shows up on every screen.
function useChange<I>(run: (input: I) => Promise<unknown>) {
  const client = useQueryClient();
  return useMutation({ mutationFn: run, onSuccess: () => client.invalidateQueries({ queryKey: ["coach-booking"] }) });
}

export const useCancel = () =>
  useChange(async ({ id, reason }: { id: string; reason?: string }) =>
    read(await api.booking.coach.bookings[":id"].cancel.$post({ param: { id }, json: { reason } }), CoachBooking),
  );

export const useReschedule = () =>
  useChange(async ({ id, start }: { id: string; start: string }) =>
    read(await api.booking.coach.bookings[":id"].reschedule.$post({ param: { id }, json: { start } }), CoachBooking),
  );

export const useOutcome = () =>
  useChange(async ({ id, status }: { id: string; status: "completed" | "no_show" }) =>
    read(await api.booking.coach.bookings[":id"].outcome.$post({ param: { id }, json: { status } }), CoachBooking),
  );

export const useSaveAvailability = () =>
  useChange(async ({ id, ...json }: AvailabilityInput & { id?: string }) =>
    id
      ? read(await api.booking.coach.availability[":id"].$put({ param: { id }, json }), Availability)
      : read(await api.booking.coach.availability.$post({ json }), Availability),
  );

export const useDeleteAvailability = () =>
  useChange(async (id: string) => done(await api.booking.coach.availability[":id"].$delete({ param: { id } })));

export const useAddException = () =>
  useChange(async (json: ExceptionInput) => read(await api.booking.coach.exceptions.$post({ json }), AvailabilityException));

export const useDeleteException = () =>
  useChange(async (id: string) => done(await api.booking.coach.exceptions[":id"].$delete({ param: { id } })));
