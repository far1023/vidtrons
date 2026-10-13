import "server-only";
import type { UserRow } from "@/server/models/user.model";
import type { UserItem } from "@/types/user";

export function toUserResource(row: UserRow): UserItem {
  return {
    id: row.id,
    email: row.email,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toUserCollection(rows: UserRow[]): UserItem[] {
  return rows.map(toUserResource);
}
