import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Studio" };

export default function StudioPage() {
  return (
    <ComingSoon
      tone="studio"
      phase="Studio"
      title="The Studio is being stitched"
      blurb="This is where you will turn a photo into an exact pattern and watch it grow round by round in 3D. It arrives in a later phase."
    />
  );
}
