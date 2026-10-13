import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/running-texts",
    "/running-texts/:path*",
    "/pengumuman",
    "/pengumuman/:path*",
    "/agenda",
    "/agenda/:path*",
    "/promo",
    "/promo/:path*",
    "/video",
    "/video/:path*",
    "/makro-ekonomi",
    "/makro-ekonomi/:path*",
    "/pengaturan",
    "/pengaturan/:path*",
    "/pengguna",
    "/pengguna/:path*",
  ],
};
