import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ChipHarness, createdAtDefinition } from "../test-utils";
import type { FilterDefinition, FilterState } from "../types";
import { nextDraft } from "./date-range";

// Fix "today" at Friday 24 April 2026. Only Date is faked, so user-event's timers still run.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 3, 24, 15, 30));
});
afterEach(() => vi.useRealTimers());

const applied = () => JSON.parse(screen.getByTestId("applied").textContent ?? "{}");
const day = (label: RegExp) => screen.getByRole("button", { name: label });

async function openCreatedDate(
  options: { defaultValue?: FilterState; applyMode?: "manual" | "instant"; definition?: FilterDefinition } = {},
) {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(
    <ChipHarness
      definitions={[options.definition ?? createdAtDefinition]}
      defaultValue={options.defaultValue}
      applyMode={options.applyMode}
      onChange={onChange}
    />,
  );
  await user.click(screen.getByRole("button", { name: /^(Add Created Date filter|Created Date filter:)/ }));
  return { user, onChange };
}

describe("presets", () => {
  it("offers the default presets plus Custom range…", async () => {
    await openCreatedDate();
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual([
      "Last day",
      "Last 7 days",
      "Last 30 days",
      "Last month",
      "Custom range…",
    ]);
  });

  it("[T] clicking a preset applies it immediately and closes, in manual mode", async () => {
    const { user, onChange } = await openCreatedDate();
    await user.click(screen.getByRole("option", { name: "Last 7 days" }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Created Date filter: Last 7 days. Edit" })).toBeInTheDocument();
  });

  it("[T] stores the preset as a key, not as dates", async () => {
    const { user } = await openCreatedDate();
    await user.click(screen.getByRole("option", { name: "Last 30 days" }));
    expect(applied()).toEqual({ createdAt: { kind: "preset", preset: "last30d" } });
  });

  it("applies with Enter on the highlighted preset", async () => {
    const { user } = await openCreatedDate();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(applied()).toEqual({ createdAt: { kind: "preset", preset: "last7d" } });
  });

  it("also applies and closes in instant mode", async () => {
    const { user, onChange } = await openCreatedDate({ applyMode: "instant" });
    await user.click(screen.getByRole("option", { name: "Last day" }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows the applied preset as selected when the editor opens", async () => {
    await openCreatedDate({ defaultValue: { createdAt: { kind: "preset", preset: "last30d" } } });
    expect(screen.getByRole("option", { name: "Last 30 days" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("option", { name: "Last 7 days" })).toHaveAttribute("aria-checked", "false");
  });

  it("respects the definition's presets and allowCustomRange", async () => {
    await openCreatedDate({
      definition: { ...createdAtDefinition, presets: ["thisMonth", "lastMonth"], allowCustomRange: false },
    });
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["This month", "Last month"]);
  });
});

describe("custom range", () => {
  it("opens a two-month calendar", async () => {
    const { user } = await openCreatedDate();
    await user.click(screen.getByRole("option", { name: /Custom range/ }));
    expect(screen.getAllByRole("grid")).toHaveLength(2);
    expect(screen.getByText("March 2026")).toBeInTheDocument();
    expect(screen.getByText("April 2026")).toBeInTheDocument();
  });

  it("[T] Apply is disabled until both ends are picked", async () => {
    const { user, onChange } = await openCreatedDate();
    await user.click(screen.getByRole("option", { name: /Custom range/ }));
    const apply = screen.getByRole("button", { name: "Apply" });
    expect(apply).toBeDisabled();

    await user.click(day(/April 18th, 2026/));
    expect(apply).toBeDisabled();

    await user.click(day(/April 24th, 2026/));
    expect(apply).toBeEnabled();
    expect(onChange).not.toHaveBeenCalled();

    await user.click(apply);
    expect(applied()).toEqual({ createdAt: { kind: "custom", from: "2026-04-18", to: "2026-04-24" } });
    expect(screen.getByRole("button", { name: "Created Date filter: Apr 18 – Apr 24. Edit" })).toBeInTheDocument();
  });

  it("allows a single-day range by clicking the same day twice", async () => {
    const { user } = await openCreatedDate();
    await user.click(screen.getByRole("option", { name: /Custom range/ }));
    await user.click(day(/April 20th, 2026/));
    await user.click(day(/April 20th, 2026/));
    await user.click(screen.getByRole("button", { name: "Apply" }));
    expect(applied()).toEqual({ createdAt: { kind: "custom", from: "2026-04-20", to: "2026-04-20" } });
  });

  it("Reset clears the picked range", async () => {
    const { user } = await openCreatedDate();
    await user.click(screen.getByRole("option", { name: /Custom range/ }));
    await user.click(day(/April 18th, 2026/));
    await user.click(day(/April 24th, 2026/));
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByRole("button", { name: "Apply" })).toBeDisabled();
  });

  it("waits for Apply in instant mode too", async () => {
    const { user, onChange } = await openCreatedDate({ applyMode: "instant" });
    await user.click(screen.getByRole("option", { name: /Custom range/ }));
    await user.click(day(/April 18th, 2026/));
    await user.click(day(/April 24th, 2026/));
    expect(onChange).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Apply" }));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("shows an applied custom range as selected, and starts the calendar from it", async () => {
    const { user } = await openCreatedDate({
      defaultValue: { createdAt: { kind: "custom", from: "2026-01-05", to: "2026-01-09" } },
    });
    const custom = screen.getByRole("option", { name: /Custom range/ });
    expect(custom).toHaveAttribute("aria-checked", "true");
    expect(custom).toHaveTextContent("Jan 5 – Jan 9");

    await user.click(custom);
    expect(screen.getByText("January 2026")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Apply" })).toBeEnabled();
  });

  it("goes back to the presets", async () => {
    const { user } = await openCreatedDate();
    await user.click(screen.getByRole("option", { name: /Custom range/ }));
    await user.click(screen.getByRole("button", { name: "Presets" }));
    expect(screen.getByRole("option", { name: "Last 7 days" })).toBeInTheDocument();
  });

  it("Escape discards the picked range and closes", async () => {
    const { user, onChange } = await openCreatedDate();
    await user.click(screen.getByRole("option", { name: /Custom range/ }));
    await user.click(day(/April 18th, 2026/));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("nextDraft", () => {
  const d = (n: number) => new Date(2026, 3, n);

  it("first click sets the start only", () => {
    expect(nextDraft({}, d(10))).toEqual({ from: d(10), to: undefined });
  });

  it("second click sets the end, in either order", () => {
    expect(nextDraft({ from: d(10) }, d(15))).toEqual({ from: d(10), to: d(15) });
    expect(nextDraft({ from: d(10) }, d(5))).toEqual({ from: d(5), to: d(10) });
  });

  it("a click after a complete range starts a new one", () => {
    expect(nextDraft({ from: d(10), to: d(15) }, d(20))).toEqual({ from: d(20), to: undefined });
  });
});
