import "server-only";
import { NotFoundError } from "@/server/errors/app-error";
import { broadcastPanelUpdate } from "@/server/services/realtime.service";
import * as videoModel from "@/server/models/video.model";
import type {
  CreateVideoInput,
  UpdateVideoInput,
} from "@/lib/schemas/video.schema";

export async function getAllVideo(): Promise<videoModel.VideoRow[]> {
  return videoModel.all();
}

export async function getVideoById(id: number): Promise<videoModel.VideoRow> {
  const item = await videoModel.find(id);
  if (!item) {
    throw new NotFoundError(`Video dengan ID ${id} tidak ditemukan`);
  }
  return item;
}

export async function createVideo(
  data: CreateVideoInput
): Promise<videoModel.VideoRow> {
  const created = await videoModel.create(data);
  await broadcastPanelUpdate("video");
  return created;
}

export async function updateVideo(
  id: number,
  data: UpdateVideoInput
): Promise<videoModel.VideoRow> {
  const existing = await videoModel.find(id);
  if (!existing) {
    throw new NotFoundError(`Video dengan ID ${id} tidak ditemukan`);
  }

  const updated = await videoModel.update(id, data);
  if (!updated) {
    throw new NotFoundError(`Video dengan ID ${id} tidak ditemukan`);
  }

  await broadcastPanelUpdate("video");
  return updated;
}

export async function deleteVideo(id: number): Promise<boolean> {
  const existing = await videoModel.find(id);
  if (!existing) {
    throw new NotFoundError(`Video dengan ID ${id} tidak ditemukan`);
  }

  const deleted = await videoModel.remove(id);
  if (!deleted) {
    throw new NotFoundError(`Video dengan ID ${id} gagal dihapus`);
  }

  await broadcastPanelUpdate("video");
  return true;
}
