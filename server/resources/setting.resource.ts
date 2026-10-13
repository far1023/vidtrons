import "server-only";

export interface SettingsResourceData {
  namaInstansi: string;
  slogan: string;
  logoUrl: string | null;
  makroQrUrl: string | null;
  makroQrLabel: string | null;
}

export function toSettingsResource(
  map: Record<string, string>
): SettingsResourceData {
  return {
    namaInstansi: map.namaInstansi || "Bappeda Kota Dumai",
    slogan: map.slogan || "Mewujudkan Dumai Kota IDAMAN",
    logoUrl: map.logoUrl || null,
    makroQrUrl: map.makroQrUrl || null,
    makroQrLabel: map.makroQrLabel || null,
  };
}
