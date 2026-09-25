import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Stage } from "react-konva"
import { Marquee } from "./marquee"
import type { MarqueeProps } from "./types"
import { lassoPoints, manyPoints } from "./__mocks__/strokes"

// Konva does not inherit CSS variables (04 §10), so a story hands the resolved colour in explicitly. The
// stories project renders each of these in real headless Chrome through Playwright.
function Harness({ dark, ...props }: MarqueeProps & { dark?: boolean }) {
  return (
    <div className={dark ? "dark" : undefined} style={{ width: props.size.w, height: props.size.h, background: dark ? "oklch(0.2 0.02 250)" : "white" }}>
      <Stage width={props.size.w} height={props.size.h}>
        <Marquee {...props} />
      </Stage>
    </div>
  )
}

const meta = {
  title: "Canvas/Marquee",
  component: Marquee,
  render: (args) => <Harness {...args} />,
  args: { tool: "rect", size: { w: 480, h: 320 }, rotation: 0 },
} satisfies Meta<typeof Marquee>

export default meta

export const Default: StoryObj<typeof meta> = {}

export const Empty: StoryObj<typeof meta> = { args: { tool: null, fixtures: [] } }

export const ManyStrokes: StoryObj<typeof meta> = { args: { tool: "freehand", fixtures: [manyPoints(220), lassoPoints()] } }

export const DarkTheme: StoryObj<typeof meta> = {
  args: { tool: "freehand", color: "oklch(0.85 0.18 95)", fixtures: [manyPoints(60)] },
  render: (args) => <Harness {...args} dark />,
}
