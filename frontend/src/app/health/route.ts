export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    {
      data: {
        status: "ok",
        service: "duocmeta-frontend",
        environment: process.env.NODE_ENV ?? "development",
      },
      meta: {},
      error: null,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
