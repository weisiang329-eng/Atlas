"use client";

import { useState } from "react";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, ConfidenceBadge } from "@/components/ui/status-badge";
import { Tabs } from "@/components/ui/tabs";
import { Dropdown } from "@/components/ui/dropdown";
import { Dialog } from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";
import { useToast, type ToastTone } from "@/components/ui/toast";
import {
  FormField,
  TextInput,
  Select,
  ValidationMessage,
} from "@/components/ui/form-field";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";

const SURFACE_TOKENS = ["bg", "surface", "surface-2", "border"];
const SEMANTIC_TOKENS = ["accent", "positive", "negative", "warning", "info"];

const TABS = [
  { id: "a", label: "Overview", content: <p className="text-sm text-muted">Overview panel content.</p> },
  { id: "b", label: "Detail", content: <p className="text-sm text-muted">Detail panel content.</p> },
  { id: "c", label: "History", content: <p className="text-sm text-muted">History panel content.</p> },
];

const TONES: ToastTone[] = ["info", "positive", "warning", "negative"];

export function StyleGuide() {
  const { notify } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [email, setEmail] = useState("");
  const emailError = email.length > 0 && !email.includes("@") ? "Enter a valid email address." : "";

  return (
    <div className="grid gap-6">
      <Panel>
        <PanelHeader eyebrow="Tokens" title="Colour" />
        <PanelBody>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[...SURFACE_TOKENS, ...SEMANTIC_TOKENS].map((t) => (
              <div key={t} className="rounded border border-border">
                <div
                  className="h-12 rounded-t"
                  style={{ backgroundColor: `var(--${t})` }}
                />
                <p className="px-2 py-1 font-mono text-2xs text-muted">--{t}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <span className="text-fg">fg — primary</span>
            <span className="text-muted">muted — secondary</span>
            <span className="text-faint">faint — tertiary</span>
          </div>
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader eyebrow="Data display" title="Badges" />
        <PanelBody className="flex flex-wrap items-center gap-2">
          <Badge tone="neutral">neutral</Badge>
          <Badge tone="accent">accent</Badge>
          <Badge tone="positive">positive</Badge>
          <Badge tone="negative">negative</Badge>
          <Badge tone="warning">warning</Badge>
          <Badge tone="info">info</Badge>
          <StatusBadge status="In review" />
          <StatusBadge status="Final" />
          <ConfidenceBadge level="High" />
          <ConfidenceBadge level="Low" />
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader eyebrow="Interaction" title="Tabs" />
        <PanelBody>
          <Tabs tabs={TABS} />
        </PanelBody>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <PanelHeader eyebrow="Interaction" title="Overlays & menus" />
          <PanelBody className="flex flex-wrap gap-2">
            <Dropdown
              label="Actions"
              items={[
                { label: "Duplicate", onSelect: () => notify({ title: "Duplicated", tone: "positive" }) },
                { label: "Archive", onSelect: () => notify({ title: "Archived", tone: "info" }) },
                { label: "Delete", onSelect: () => notify({ title: "Deleted", tone: "negative" }), disabled: true },
              ]}
            />
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="rounded border border-border bg-surface px-3 py-1.5 text-sm text-fg hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              Open dialog
            </button>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="rounded border border-border bg-surface px-3 py-1.5 text-sm text-fg hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              Open drawer
            </button>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader eyebrow="Interaction" title="Notifications" />
          <PanelBody className="flex flex-wrap gap-2">
            {TONES.map((tone) => (
              <button
                key={tone}
                type="button"
                onClick={() =>
                  notify({
                    title: `${tone[0]!.toUpperCase()}${tone.slice(1)} notification`,
                    description: "This is a sample toast.",
                    tone,
                  })
                }
                className="rounded border border-border bg-surface px-3 py-1.5 text-sm text-fg hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              >
                {tone}
              </button>
            ))}
          </PanelBody>
        </Panel>
      </div>

      <Panel>
        <PanelHeader eyebrow="Interaction" title="Form" />
        <PanelBody>
          <div className="grid max-w-md gap-4">
            <FormField
              label="Email"
              htmlFor="sg-email"
              required
              error={emailError}
              hint={emailError ? undefined : "We never share your email."}
            >
              <TextInput
                id="sg-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(emailError)}
              />
            </FormField>
            <FormField label="Workspace" htmlFor="sg-ws">
              <Select id="sg-ws" defaultValue="companies">
                <option value="companies">Companies</option>
                <option value="research">Research</option>
                <option value="financials">Financials</option>
              </Select>
            </FormField>
            <ValidationMessage tone="hint">
              Form primitives are presentational — no submission wired.
            </ValidationMessage>
          </div>
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader eyebrow="Feedback" title="States" />
        <PanelBody className="grid gap-4 lg:grid-cols-3">
          <LoadingState label="Loading sample" />
          <EmptyState title="Empty" body="No data to show yet." />
          <ErrorState message="Something went wrong loading this section." />
        </PanelBody>
      </Panel>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Sample dialog"
      >
        <div className="p-4">
          <p className="text-sm text-muted">
            An accessible modal — focus-trapped, Escape and overlay-click to close.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDialogOpen(false)}
              className="rounded border border-border bg-surface px-3 py-1.5 text-sm text-fg hover:bg-surface-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setDialogOpen(false);
                notify({ title: "Confirmed", tone: "positive" });
              }}
              className="rounded border border-accent-dim bg-accent px-3 py-1.5 text-sm font-medium text-black"
            >
              Confirm
            </button>
          </div>
        </div>
      </Dialog>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Sample drawer"
      >
        <div className="p-4">
          <p className="text-sm text-muted">
            A side sheet on the same overlay core as Dialog.
          </p>
        </div>
      </Drawer>
    </div>
  );
}
