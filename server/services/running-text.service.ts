import "server-only";
import { NotFoundError } from "@/server/errors/app-error";
import { broadcastPanelUpdate } from "@/server/services/realtime.service";
import * as runningTextModel from "@/server/models/running-text.model";
import type {
  CreateRunningTextInput,
  UpdateRunningTextInput,
} from "@/lib/schemas/running-text.schema";

export async function getAllRunningTexts(): Promise<runningTextModel.RunningTextRow[]> {
  return runningTextModel.all();
}

export async function getActiveRunningTexts(): Promise<runningTextModel.RunningTextRow[]> {
  return runningTextModel.active();
}

export async function getRunningTextById(id: number): Promise<runningTextModel.RunningTextRow> {
  const item = await runningTextModel.find(id);
  if (!item) {
    throw new NotFoundError(`Running text dengan ID ${id} tidak ditemukan`);
  }
  return item;
}

export async function createRunningText(
  data: CreateRunningTextInput
): Promise<runningTextModel.RunningTextRow> {
  const created = await runningTextModel.create(data);
  await broadcastPanelUpdate("runningText");
  return created;
}

export async function updateRunningText(
  id: number,
  data: UpdateRunningTextInput
): Promise<runningTextModel.RunningTextRow> {
  const existing = await runningTextModel.find(id);
  if (!existing) {
    throw new NotFoundError(`Running text dengan ID ${id} tidak ditemukan`);
  }

  const updated = await runningTextModel.update(id, data);
  if (!updated) {
    throw new NotFoundError(`Running text dengan ID ${id} tidak ditemukan`);
  }

  await broadcastPanelUpdate("runningText");
  return updated;
}

export async function deleteRunningText(id: number): Promise<boolean> {
  const existing = await runningTextModel.find(id);
  if (!existing) {
    throw new NotFoundError(`Running text dengan ID ${id} tidak ditemukan`);
  }

  const deleted = await runningTextModel.remove(id);
  if (!deleted) {
    throw new NotFoundError(`Running text dengan ID ${id} gagal dihapus`);
  }

  await broadcastPanelUpdate("runningText");
  return true;
}
