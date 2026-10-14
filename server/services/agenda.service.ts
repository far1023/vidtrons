import "server-only";
import { NotFoundError } from "@/server/errors/app-error";
import { broadcastPanelUpdate } from "@/server/services/realtime.service";
import * as agendaModel from "@/server/models/agenda.model";
import type {
  CreateAgendaInput,
  UpdateAgendaInput,
} from "@/lib/schemas/agenda.schema";

export async function getAllAgenda(): Promise<agendaModel.AgendaRow[]> {
  return agendaModel.all();
}

export async function getAgendaById(id: number): Promise<agendaModel.AgendaRow> {
  const item = await agendaModel.find(id);
  if (!item) {
    throw new NotFoundError(`Agenda dengan ID ${id} tidak ditemukan`);
  }
  return item;
}

export async function createAgenda(
  data: CreateAgendaInput
): Promise<agendaModel.AgendaRow> {
  const created = await agendaModel.create(data);
  await broadcastPanelUpdate("agenda");
  return created;
}

export async function updateAgenda(
  id: number,
  data: UpdateAgendaInput
): Promise<agendaModel.AgendaRow> {
  const existing = await agendaModel.find(id);
  if (!existing) {
    throw new NotFoundError(`Agenda dengan ID ${id} tidak ditemukan`);
  }

  const updated = await agendaModel.update(id, data);
  if (!updated) {
    throw new NotFoundError(`Agenda dengan ID ${id} tidak ditemukan`);
  }

  await broadcastPanelUpdate("agenda");
  return updated;
}

export async function deleteAgenda(id: number): Promise<boolean> {
  const existing = await agendaModel.find(id);
  if (!existing) {
    throw new NotFoundError(`Agenda dengan ID ${id} tidak ditemukan`);
  }

  const deleted = await agendaModel.remove(id);
  if (!deleted) {
    throw new NotFoundError(`Agenda dengan ID ${id} gagal dihapus`);
  }

  await broadcastPanelUpdate("agenda");
  return true;
}
