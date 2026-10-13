import "server-only";
import bcrypt from "bcryptjs";
import { ConflictError, NotFoundError } from "@/server/errors/app-error";
import * as userModel from "@/server/models/user.model";
import type {
  CreateUserInput,
  UpdateUserInput,
} from "@/lib/schemas/user.schema";

// Users are not part of the display feed, so these writes do not
// need to revalidate the display cache tag.

const BCRYPT_ROUNDS = 10;

export async function getAllUsers(): Promise<userModel.UserRow[]> {
  return userModel.all();
}

export async function getUserById(id: number): Promise<userModel.UserRow> {
  const item = await userModel.find(id);
  if (!item) {
    throw new NotFoundError(`Pengguna dengan ID ${id} tidak ditemukan`);
  }
  return item;
}

export async function createUser(
  data: CreateUserInput
): Promise<userModel.UserRow> {
  if (await userModel.findByEmail(data.email)) {
    throw new ConflictError("Email sudah digunakan oleh pengguna lain");
  }

  const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
  return userModel.create({ email: data.email, passwordHash });
}

export async function updateUser(
  id: number,
  data: UpdateUserInput
): Promise<userModel.UserRow> {
  const existing = await getUserById(id);

  const patch: Partial<{ email: string; passwordHash: string }> = {};

  if (data.email !== undefined && data.email !== existing.email) {
    const owner = await userModel.findByEmail(data.email);
    if (owner && owner.id !== id) {
      throw new ConflictError("Email sudah digunakan oleh pengguna lain");
    }
    patch.email = data.email;
  }

  if (data.password !== undefined) {
    patch.passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
  }

  if (Object.keys(patch).length === 0) {
    return existing;
  }

  const updated = await userModel.update(id, patch);
  if (!updated) {
    throw new NotFoundError(`Pengguna dengan ID ${id} tidak ditemukan`);
  }
  return updated;
}

/**
 * Deletes a user. Guards: the signed-in user cannot delete themselves,
 * and the last remaining user can never be deleted (would lock everyone out).
 */
export async function deleteUser(
  id: number,
  currentUserId: number | null
): Promise<boolean> {
  await getUserById(id);

  if (currentUserId !== null && currentUserId === id) {
    throw new ConflictError(
      "Anda tidak dapat menghapus akun yang sedang digunakan"
    );
  }

  if ((await userModel.total()) <= 1) {
    throw new ConflictError(
      "Pengguna terakhir tidak dapat dihapus. Minimal harus ada satu pengguna"
    );
  }

  const deleted = await userModel.remove(id);
  if (!deleted) {
    throw new NotFoundError(`Pengguna dengan ID ${id} gagal dihapus`);
  }
  return true;
}
