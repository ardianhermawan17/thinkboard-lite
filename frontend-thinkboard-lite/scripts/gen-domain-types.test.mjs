// Tests for the domain type generator (task 003 g1). Run: node --test "scripts/*.test.mjs"
import assert from "node:assert/strict"
import { test } from "node:test"
import { fileName, generate, parse, typeName } from "./gen-domain-types.mjs"

// The shape `supabase gen types typescript` prints, trimmed to what the generator reads.
const cli = `export type Database = {
  public: {
    Tables: {
      artifacts: {
        Row: {
          bbox: Json | null
          created_at: string
          created_by: string | null
          id: string
          kind: Database["public"]["Enums"]["artifact_kind"]
          page_count: number | null
          session_id: string
          tags: string[]
          title: string | null
        }
        Insert: {
          id?: string
        }
        Update: {
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "artifacts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifacts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_identities: {
        Row: {
          auth_user_id: string
          id: string
          stage: Database["public"]["Enums"]["pipeline_stage"]
        }
        Insert: {
          id?: string
        }
        Update: {
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Enums: {
      artifact_kind: "pdf" | "image"
      pipeline_stage:
        | "scope_anchor"
        | "analytic"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export const Constants = {
  public: {
    Enums: {
      artifact_kind: ["pdf", "image"],
      pipeline_stage: ["scope_anchor", "analytic"],
    },
  },
} as const
`

test("names: kebab-case files, PascalCase singular types", () => {
  assert.equal(fileName("highlight_notes"), "highlight-notes.ts")
  assert.deepEqual(["highlight_notes", "profile_identities", "memory_entries", "llm_providers", "user_llm_keys"].map(typeName), ["HighlightNote", "ProfileIdentity", "MemoryEntry", "LlmProvider", "UserLlmKey"])
})

test("parse reads rows, foreign keys and multi-line enums, and ignores Insert/Update", () => {
  const { enums, tables } = parse(cli)
  assert.deepEqual(enums, { artifact_kind: '"pdf" | "image"', pipeline_stage: '"scope_anchor" | "analytic"' })
  assert.equal(tables.artifacts.row.length, 9)
  assert.deepEqual(tables.artifacts.fks, { created_by: "profiles", session_id: "sessions" })
})

test("generate brands ids, foreign keys and timestamps, and inlines enums", () => {
  const out = generate(cli, ["artifacts", "profile_identities"])
  assert.deepEqual([...out.keys()], ["artifacts.ts", "profile-identities.ts"])
  const a = out.get("artifacts.ts")
  for (const line of [
    'import type { ISODateString, Json, UUID } from "./common"',
    "export type Artifact = {",
    '  id: UUID<"artifacts">',
    '  created_by: UUID<"profiles"> | null',
    '  session_id: UUID<"sessions">',
    "  created_at: ISODateString",
    '  kind: "pdf" | "image"',
    "  bbox: Json | null",
    "  tags: string[]",
    "  title: string | null",
    "  page_count: number | null",
  ]) assert.ok(a.includes(line), `missing: ${line}`)
  const p = out.get("profile-identities.ts")
  assert.ok(p.includes("  auth_user_id: UUID\n") && p.includes('  stage: "scope_anchor" | "analytic"'))
})

test("no generated line trips I9 (a bare string on id, *_id or *_at)", () => {
  const bare = /^\s*((?:\w+_)?id|\w+_at)\??\s*:\s*string\b/m
  for (const [file, text] of generate(cli, ["artifacts", "profile_identities"])) assert.equal(bare.test(text), false, file)
})

test("fails loudly on a missing table, an unknown enum and an unrecognised output", () => {
  assert.throws(() => generate(cli, ["nope"]), /table "nope" is not found/)
  assert.throws(() => generate(cli.replace('artifact_kind: "pdf" | "image"', ""), ["artifacts"]), /enum "artifact_kind"/)
  assert.throws(() => parse("export type Database = {}"), /unexpected shape/)
})
