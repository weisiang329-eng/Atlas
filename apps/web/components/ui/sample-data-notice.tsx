import { Badge } from "@/components/ui/badge";

/**
 * "What you are looking at is not real."
 *
 * Atlas's first rule is that no figure is ever invented for a real company, so
 * where a screen is still driven by `lib/mock/*` it has to say so — visibly,
 * on the screen itself, not in a code comment.
 *
 * One component rather than a hand-rolled badge per page, for two reasons.
 * First, consistency: an audit found the same idea spelled "Mock",
 * "Sample data", "Sample structure" and — on eight pages — not at all.
 * Second, tone: several of these used `tone="accent"`, the brand gold also
 * used for live-data highlights, which made "this is fabricated" look like a
 * feature callout. Warning amber is the honest register.
 *
 * `reason` should say what unblocks the real thing, so the notice doubles as
 * the work item. Keep it concrete: a table, a feed, a key, a programme.
 */
export function SampleDataNotice({ reason }: { reason: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-panel border border-warning/30 bg-warning/5 px-4 py-3">
      <Badge tone="warning">Sample data</Badge>
      <p className="text-2xs leading-relaxed text-muted">
        Figures on this page are illustrative and describe no real entity.{" "}
        <span className="text-faint">{reason}</span>
      </p>
    </div>
  );
}
