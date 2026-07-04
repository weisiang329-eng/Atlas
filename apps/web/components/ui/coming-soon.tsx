import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelBody } from "@/components/ui/panel";
import { EmptyState } from "@/components/ui/empty-state";

interface ComingSoonProps {
  eyebrow?: string;
  title: string;
  description: string;
  /** Optional list of what will eventually live in this module. */
  points?: string[];
}

/**
 * Full-width placeholder for modules that are navigable but intentionally
 * unbuilt in Milestone 1 (Industries, Portfolio, Watchlist, Alerts, etc.).
 */
export function ComingSoon({
  eyebrow,
  title,
  description,
  points,
}: ComingSoonProps) {
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <Panel>
        <PanelBody>
          <EmptyState
            title={`${title} is planned`}
            body="This module is part of the Atlas roadmap and is not built in Milestone 1. The navigation and route exist so the platform shape is visible."
          />
          {points && points.length > 0 ? (
            <ul className="mx-auto mt-6 max-w-md space-y-2">
              {points.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-2.5 text-sm text-muted"
                >
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-faint" />
                  {point}
                </li>
              ))}
            </ul>
          ) : null}
        </PanelBody>
      </Panel>
    </>
  );
}
