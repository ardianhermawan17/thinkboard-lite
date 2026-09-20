import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

// vitest runs from the project root
const root = process.cwd()
const files = (dir: string): string[] => readdirSync(dir).flatMap((name) => (statSync(join(dir, name)).isDirectory() ? files(join(dir, name)) : [join(dir, name)]))

describe("design tokens (g1, g2)", () => {
  it("has no hex colour under shared/components: colours are theme tokens", () => {
    const hits = files(join(root, "src/shared/components"))
      .filter((f) => /\.(tsx?|css)$/.test(f))
      .flatMap((f) => [...readFileSync(f, "utf8").matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) => `${f}: ${m[0]}`))
    expect(hits).toEqual([])
  })

  it("defines each highlight colour for light AND dark: the same hue, a lower alpha in dark (spec §5.3)", () => {
    const css = readFileSync(join(root, "src/app/globals.css"), "utf8")
    const found = [...css.matchAll(/--highlight-(\w+):\s*oklch\(([\d.]+) ([\d.]+) ([\d.]+) \/ (\d+)%\)/g)]
    const byName = Object.groupBy(found, (m) => m[1])
    expect(Object.keys(byName).sort()).toEqual(["blue", "green", "rose", "yellow"])
    for (const [name, [light, dark]] of Object.entries(byName) as [string, RegExpMatchArray[]][]) {
      expect(byName[name]).toHaveLength(2) // once in :root, once in .dark
      expect(dark.slice(2, 5)).toEqual(light.slice(2, 5)) // lightness, chroma, hue: unchanged
      expect(Number(dark[5])).toBeLessThan(Number(light[5])) // only the alpha drops
    }
  })

  it("maps every highlight token into Tailwind, so bg-highlight-* utilities exist", () => {
    const css = readFileSync(join(root, "src/app/globals.css"), "utf8")
    for (const name of ["yellow", "green", "blue", "rose"]) expect(css).toContain(`--color-highlight-${name}: var(--highlight-${name})`)
  })
})
