// Lint fixture for eslint.architecture.mjs (task 000, package E, g16). Run: node --test "scripts/*.test.mjs"
// Code is linted from memory at virtual paths, so no planted violation ever exists on disk.
import assert from "node:assert/strict"
import { dirname, join } from "node:path"
import { test } from "node:test"
import { fileURLToPath } from "node:url"
import { ESLint } from "eslint"
import architecture from "../eslint.architecture.mjs"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const eslint = new ESLint({
  cwd: ROOT,
  overrideConfigFile: true,
  overrideConfig: [{ files: ["**/*.{ts,tsx}"], languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } } }, ...architecture],
})

async function ruleIds(path, code) {
  const [result] = await eslint.lintText(code, { filePath: join(ROOT, path) })
  return result.messages.map((m) => m.ruleId ?? `parse: ${m.message}`)
}

const CASES = [
  // [invariant, path, code, expected rule ids]
  ["I3", "src/shared/lib/pdf.ts", 'import { db } from "@feature/entities"\n', ["thinkboard/i3"]],
  ["I3 exception", "src/shared/config/redux/store.ts", 'import { canvasSlice } from "@feature/highlight"\n', []],
  ["I18", "src/shared/components/canvas/marquee/marquee.painter.ts", '"use client"\nimport { useAppSelector } from "@shared/config/redux/hooks"\n', ["thinkboard/i18"]],
  ["I20", "src/shared/components/canvas/marquee/marquee.tsx", '"use client"\nimport { motion } from "motion/react"\n', ["thinkboard/i20"]],
  ["I20 DOM is fine", "src/features/notes/components/note-sheet/note-sheet.tsx", 'import { motion } from "motion/react"\n', []],
  ["I21", "src/features/highlight/utils/save.ts", 'import { createClient } from "@supabase/supabase-js"\n', ["thinkboard/i21"]],
  ["I21 seam", "src/shared/lib/supabase.ts", 'import { createClient } from "@supabase/supabase-js"\n', []],
  ["I21 seam 2", "src/features/sync/realtime/channel.ts", 'import { createClient } from "@supabase/supabase-js"\n', []],
  ["I23", "src/features/highlight/components/sheet/use-sheet.ts", 'import { useLiveQuery } from "dexie-react-hooks"\n', ["thinkboard/i23"]],
  ["I23 seam", "src/features/entities/queries/use-run.ts", 'import { useLiveQuery } from "dexie-react-hooks"\n', []],
  ["I26 library", "src/features/notes/components/note-editor/note-editor.tsx", 'import { useEditor } from "@tiptap/react"\n', ["thinkboard/i26"]],
  ["I26 contentEditable", "src/features/notes/components/note-editor/note-editor.tsx", "export const E = () => <div contentEditable />\n", ["thinkboard/i26"]],
  ["I26 textarea", "src/features/notes/components/note-editor/note-editor.tsx", "export const E = () => <textarea spellCheck={false} />\n", []],
  ["I29", "src/features/highlight/utils/cache.ts", 'import Dexie from "dexie"\n', ["thinkboard/i29"]],
  ["I29 seam", "src/features/entities/repository/highlight-repository.ts", 'import Dexie from "dexie"\n', []],
  ["dynamic import", "src/features/result/utils/load.ts", 'export const load = () => import("dexie")\n', ["thinkboard/i29"]],
  ["re-export", "src/shared/lib/index.ts", 'export * from "@app/layout"\n', ["thinkboard/i3"]],
]

for (const [name, path, code, expected] of CASES) {
  test(`${name}: ${path}`, async () => {
    assert.deepEqual(await ruleIds(path, code), expected)
  })
}

test("a painter under shared/components/canvas gets every rule that applies — none overrides another", async () => {
  const code = '"use client"\nimport { x } from "@feature/entities"\nimport { motion } from "motion/react"\nimport Dexie from "dexie"\n'
  const ids = await ruleIds("src/shared/components/canvas/marquee/marquee.painter.ts", code)
  assert.deepEqual(ids.sort(), ["thinkboard/i18", "thinkboard/i20", "thinkboard/i29", "thinkboard/i3"])
})
