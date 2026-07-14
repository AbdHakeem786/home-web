import { IAvailabilitySlot } from "../models/WorkerProfile";

// An empty schedule means the worker never set one, so treat them as always
// available rather than suddenly blocking every booking request.
export function isWorkerAvailableAt(schedule: IAvailabilitySlot[], date: string, time: string): boolean {
  if (schedule.length === 0) return true;

  const day = new Date(`${date}T00:00:00`).getDay();
  return schedule.some((slot) => slot.day === day && time >= slot.startTime && time <= slot.endTime);
}
