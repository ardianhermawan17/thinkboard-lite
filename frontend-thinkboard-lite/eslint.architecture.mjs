// Architecture lint rules for ThinkBoard Lite — task 000, package E (todo-task-000-split.md §2, §4).
// A flat-config ARRAY. Task 004 spreads it into eslint.config.mjs; this file owns nothing else.
//
// One rule per invariant, each with its own id. Core `no-restricted-imports` cannot do this: it is a single
// rule, so when two blocks match one file (a painter under shared/components/canvas/) the later block's
// list silently replaces the earlier one.

const matches = (spec, pattern) =>
  pattern.endsWith("/*") ? spec.startsWith(pattern.slice(0, -1)) : spec === pattern || spec.startsWith(pattern + "/")

function restrictImports(patterns, why, extra = () => ({})) {
  return {
    meta: { type: "problem", schema: [], messages: { banned: `"{{spec}}" — ${why}`, other: `{{what}} — ${why}` } },
    create(context) {
      const check = (node) => {
        const spec = node.source?.value
        if (typeof spec === "string" && patterns.some((p) => matches(spec, p)))
          context.report({ node: node.source, messageId: "banned", data: { spec } })
      }
      return { ImportDeclaration: check, ExportNamedDeclaration: check, ExportAllDeclaration: check, ImportExpression: check, ...extra(context) }
    },
  }
}

const RICH_TEXT = ["@tiptap/*", "slate", "slate-react", "prosemirror-state", "prosemirror-view", "prosemirror-model", "lexical", "@lexical/*", "draft-js", "quill", "react-quill", "@editorjs/*"]

const rules = {
  i3: restrictImports(["@feature/*", "@app/*"], "shared/ must not depend on features/ or app/ (I3)"),
  i18: restrictImports(["@feature/*", "@shared/config/*"], "a painter takes data and a layer ref, nothing else (I18)"),
  i20: restrictImports(["motion"], "Konva owns animation on the canvas; motion animates DOM only (I20)"),
  i21: restrictImports(["@supabase/supabase-js"], "only shared/lib/supabase.ts and features/sync/realtime/channel.ts import it; anything else bypasses the outbox (I21)"),
  i23: restrictImports(["dexie-react-hooks"], "useLiveQuery lives only in features/entities/queries (I23)"),
  i26: restrictImports(RICH_TEXT, "a note is a plain <textarea>, or OS handwriting stops working (I26)", (context) => ({
    JSXAttribute(node) {
      if (node.name?.name === "contentEditable") context.report({ node, messageId: "other", data: { what: "contentEditable" } })
    },
  })),
  i29: restrictImports(["dexie"], "Dexie is imported only in features/entities/{db,repository,queries} (I29)"),
}

const on = (id) => ({ [`thinkboard/${id}`]: "error" })

export default [
  { plugins: { thinkboard: { meta: { name: "thinkboard-architecture" }, rules } } },
  { files: ["src/shared/**/*.{ts,tsx}"], ignores: ["src/shared/config/redux/store.ts"], rules: on("i3") },
  { files: ["src/**/*.painter.ts"], rules: on("i18") },
  { files: ["src/shared/components/canvas/**/*.{ts,tsx}"], rules: on("i20") },
  { files: ["src/**/*.{ts,tsx}"], ignores: ["src/shared/lib/supabase.ts", "src/features/sync/realtime/channel.ts"], rules: on("i21") },
  { files: ["src/**/*.{ts,tsx}"], ignores: ["src/features/entities/queries/**"], rules: on("i23") },
  { files: ["src/features/notes/**/*.{ts,tsx}"], rules: on("i26") },
  { files: ["src/**/*.{ts,tsx}"], ignores: ["src/features/entities/{db,repository,queries}/**"], rules: on("i29") },
]
