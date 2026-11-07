import { getShareLinkSource } from "@/lib/data/share-links";
import { shareLinkTarget } from "@/lib/validation/share-link";

/**
 * Share links: /de/facultad → /?utm_source=whatsapp&utm_campaign=facultad.
 * Short and readable to post in a group; Umami reads the UTM tags of the
 * page it lands on. Unknown links still land on the store, untagged.
 * Temporary redirect, so a deleted link stops working within minutes.
 */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/de/[slug]">,
) {
  const { slug } = await params;
  const source = await getShareLinkSource(slug.toLowerCase());
  const target = source ? shareLinkTarget(slug.toLowerCase(), source) : "/";
  return new Response(null, {
    status: 307,
    headers: {
      // Relative: stays on whatever domain the link was opened from.
      Location: target,
      "Cache-Control": "public, max-age=0, s-maxage=300",
    },
  });
}
