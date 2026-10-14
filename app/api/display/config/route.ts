export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    pusher: {
      key: process.env.NEXT_PUBLIC_PUSHER_KEY || process.env.PUSHER_KEY || null,
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || process.env.PUSHER_CLUSTER || "ap1",
    },
  });
}
