import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ReadinessRadarChart } from "@/components/analytics/readiness-radar-chart";
import { TopicMasteryChart } from "@/components/analytics/topic-mastery-chart";
import { ThemeToggle } from "@/components/theme/theme-toggle";

describe("product polish components", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        addEventListener: vi.fn(),
        matches: false,
        removeEventListener: vi.fn(),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete document.documentElement.dataset.theme;
  });

  it("cycles through explicit color preferences", () => {
    render(<ThemeToggle />);

    const toggle = screen.getByRole("button", { name: /system theme/i });
    fireEvent.click(toggle);

    expect(window.localStorage.getItem("theme")).toBe("light");
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(
      screen.getByRole("button", { name: /light theme/i }),
    ).toBeInTheDocument();
  });

  it("provides exact readiness values alongside the visual chart", () => {
    render(
      <ReadinessRadarChart
        dimensions={[
          { label: "Core patterns", value: 72 },
          { label: "Independence", value: 64 },
          { label: "Recognition", value: 81 },
        ]}
      />,
    );

    expect(
      screen.getByRole("img", { name: /readiness balance/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("81")).toBeInTheDocument();
  });

  it("exposes topic bars as named progress values", () => {
    render(
      <TopicMasteryChart
        items={[{ href: "/learn/arrays", name: "Arrays", value: 68.4 }]}
      />,
    );

    expect(
      screen.getByRole("progressbar", { name: "Arrays: 68 out of 100" }),
    ).toHaveAttribute("aria-valuenow", "68");
  });
});
