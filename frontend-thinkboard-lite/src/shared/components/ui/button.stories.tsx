import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Button } from "@shared/components/ui/button"

const meta = { component: Button, args: { children: "Button" } } satisfies Meta<typeof Button>

export default meta

export const Default: StoryObj<typeof meta> = {}
