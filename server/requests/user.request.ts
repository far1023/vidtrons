import "server-only";
import { validateJson, validateIdParam, type RouteContext } from "./base";
import { readSessionToken } from "@/server/middleware/with-auth";
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserInput,
  type UpdateUserInput,
} from "@/lib/schemas/user.schema";

export { validateIdParam, type RouteContext };

export async function parseStoreUserRequest(
  request: Request
): Promise<CreateUserInput> {
  return validateJson(request, createUserSchema, "Validasi data pengguna gagal");
}

export async function parseUpdateUserRequest(
  request: Request
): Promise<UpdateUserInput> {
  return validateJson(
    request,
    updateUserSchema,
    "Validasi pembaruan pengguna gagal"
  );
}

/** Id of the signed-in user from the session JWT (null for the dev test bypass). */
export async function getCurrentUserId(request: Request): Promise<number | null> {
  const token = await readSessionToken(request);
  const id = Number(token?.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}
