import { NextResponse } from "next/server";
import { getAllPickupPoints } from "@/lib/shipping/pickup-points-fetch";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const points = await getAllPickupPoints();
    return NextResponse.json({
      points,
      count: points.length,
      providers: {
        foxpost: points.filter((p) => p.provider === "foxpost").length,
        gls: points.filter((p) => p.provider === "gls").length,
        mpl: points.filter((p) => p.provider === "mpl").length,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ismeretlen hiba";
    console.error("[api/shipping/pickup-points]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
