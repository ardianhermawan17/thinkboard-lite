// Fixture trees for verify-architecture.mjs --fixtures (task 000, package D, g14).
// `clean` must pass every scripted invariant. Each case overlays `files` on it (null removes a file) and
// must fail exactly its own id — a check that fires under the wrong id is a false green somewhere else.

const uc = '"use client"\n'

export const clean = {
  "tsconfig.json": JSON.stringify({ compilerOptions: { paths: { "@app/*": ["./src/app/*"], "@feature/*": ["./src/features/*"], "@shared/*": ["./src/shared/*"], "@public/*": ["./public/*"] } } }),
  "vitest.config.mts": 'import { defineConfig } from "vitest/config"\nexport default defineConfig({ resolve: { alias: { "@app": "/src/app", "@feature": "/src/features", "@shared": "/src/shared", "@public": "/public" } } })\n',

  "src/app/layout.tsx": "export default function RootLayout({ children }) { return children }\n",
  "src/app/w/[workspaceId]/page.tsx": 'import dynamic from "next/dynamic"\nconst Shell = dynamic(() => import("@feature/workspace/components/workspace-shell"), { ssr: false })\nexport default function Page() { return <Shell /> }\n',
  "src/app/api/v1/workspaces/route.ts": 'export async function POST() { return Response.json({ id: "w1" }) }\n',

  "src/shared/config/redux/store.ts": [
    'import { combineReducers, configureStore } from "@reduxjs/toolkit"',
    'import { canvasSlice } from "@feature/highlight/stores/canvas-slice"',
    'import { resultApi } from "@feature/result/api/result-api"',
    'import { listenerMiddleware } from "./listener"',
    "const rootReducer = combineReducers({ canvas: canvasSlice.reducer, [resultApi.reducerPath]: resultApi.reducer })",
    "export const makeStore = () =>",
    "  configureStore({ reducer: rootReducer, middleware: (getDefault) => getDefault().prepend(listenerMiddleware.middleware).concat(resultApi.middleware) })",
    "",
  ].join("\n"),
  "src/shared/config/redux/persist.ts": 'import { stripUi } from "./strip-ui"\nexport const persistConfig = { key: "root", whitelist: ["canvas"], transforms: [stripUi] }\n',
  "src/shared/config/redux/strip-ui.ts": "export const stripUi = {}\n",
  "src/shared/config/redux/listener.ts": "export const listenerMiddleware = { middleware: null }\n",

  "src/features/highlight/types/redux.ts": "export type CanvasState = {\n  tool: { active: string }\n  ui: { selectedHighlightId: string | null }\n}\n",
  "src/features/highlight/stores/canvas-slice.ts": 'import { createSlice } from "@reduxjs/toolkit"\nimport type { CanvasState } from "../types/redux"\nconst initialState: CanvasState = { tool: { active: "select" }, ui: { selectedHighlightId: null } }\nexport const canvasSlice = createSlice({ name: "canvas", initialState, reducers: {} })\n',

  "src/features/result/api/result-api/result-api.ts": [
    'import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"',
    "export const resultApi = createApi({",
    '  reducerPath: "resultApi",',
    '  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),',
    "  endpoints: (build) => ({",
    '    generateResult: build.mutation({ query: (id) => ({ url: `/v1/workspaces/${id}/results`, method: "POST" }) }),',
    "  }),",
    "})",
    "",
  ].join("\n"),
  "src/features/result/api/result-api/index.ts": 'export * from "./result-api"\n',
  "src/features/result/components/result-panel/result-panel.tsx": 'import { useResultPanel } from "./use-result-panel"\nexport function ResultPanel() { const { onGenerate } = useResultPanel(); return <button onClick={onGenerate}>Run</button> }\n',
  "src/features/result/components/result-panel/use-result-panel.ts": 'import { useGenerateResultMutation } from "@feature/result/api/result-api"\nexport function useResultPanel() { const [generate] = useGenerateResultMutation(); return { onGenerate: () => generate("w1") } }\n',
  "src/features/result/components/result-panel/index.ts": 'export * from "./result-panel"\n',

  "src/features/entities/db/thinkboard-db.ts": uc + "export const db = { version: () => ({ stores: () => {} }) }\n",
  "src/features/entities/queries/use-meta.ts": 'import { db } from "../db/thinkboard-db"\nexport const useMeta = (key) => db.meta.get(key)\n',
  "src/features/entities/queries/use-artifacts.ts": 'import { db } from "../db/thinkboard-db"\nexport const useArtifacts = (id) => db.artifacts.get(id)\n',
  "src/features/entities/queries/use-highlights-for-page.ts": 'import { db } from "../db/thinkboard-db"\nexport const useHighlightsForPage = (a, p) => db.highlights.where("[artifactId+page]").equals([a, p])\n',
  "src/features/entities/queries/use-notes-for-highlight.ts": 'import { db } from "../db/thinkboard-db"\nexport const useNotesForHighlight = (h) => db.notes.where("highlightId").equals(h)\n',
  "src/features/entities/queries/use-mini-conclusion.ts": 'import { db } from "../db/thinkboard-db"\nexport const useMiniConclusion = (h) => db.miniConclusions.get(h)\n',
  "src/features/entities/queries/use-run.ts": 'import { db } from "../db/thinkboard-db"\nexport const useRun = (id) => db.runs.get(id)\n',
  "src/features/entities/queries/use-outbox-count.ts": 'import { db } from "../db/thinkboard-db"\nexport const useOutboxCount = () => db.outbox.count()\n',

  "src/features/sync/realtime/channel.ts": "export async function openChannels(supabase, sessionId) {\n  await supabase.realtime.setAuth()\n  supabase.channel(`ws:${sessionId}`).subscribe()\n}\n",

  "src/shared/types/domain/common.ts": 'export type UUID = string & { __brand: "UUID" }\nexport type ISODateString = string & { __brand: "ISODateString" }\n',
  "src/shared/types/domain/highlights.ts": 'import type { ISODateString, UUID } from "./common"\nexport type Highlight = {\n  id: UUID\n  artifact_id: UUID\n  updated_at: ISODateString\n}\n',

  "src/shared/components/template/sync-pill/sync-pill.tsx": "export function SyncPill() { return null }\n",
  "src/shared/components/template/sync-pill/index.ts": 'export * from "./sync-pill"\n',
  "src/shared/components/canvas/page-stage/page-stage.tsx": uc + "export function PageStage() { return null }\n",
  "src/shared/components/canvas/page-stage/index.ts": 'export * from "./page-stage"\n',
  "src/shared/components/canvas/highlight-layer/highlight-layer.tsx": uc + 'import { useHighlightLayer } from "./use-highlight-layer"\nexport function HighlightLayer() { useHighlightLayer(); return null }\n',
  "src/shared/components/canvas/highlight-layer/use-highlight-layer.ts": uc + "export function useHighlightLayer() { return {} }\n",
  "src/shared/components/canvas/highlight-layer/highlight-layer.painter.ts": uc + "export function createStrokePainter(layer) { layer.batchDraw(); return { dispose() {} } }\n",
  "src/shared/components/canvas/highlight-layer/types.ts": "export type Point = { x: number; y: number }\n",
  "src/shared/components/canvas/highlight-layer/index.ts": 'export * from "./highlight-layer"\nexport * from "./use-highlight-layer"\n',
  "src/shared/components/canvas/peer-cursors/peer-cursors.tsx": uc + "export function PeerCursors() { return null }\n",
  "src/shared/components/canvas/peer-cursors/peer-cursors.painter.ts": uc + "export function createCursorPainter(layer) { layer.batchDraw() }\n",
  "src/shared/components/canvas/peer-cursors/index.ts": 'export * from "./peer-cursors"\n',
  "src/shared/components/canvas/marquee/marquee.tsx": uc + "export function Marquee() { return null }\n",
  "src/shared/components/canvas/marquee/marquee.painter.ts": uc + "export function createMarqueePainter(layer) { layer.batchDraw() }\n",
  "src/shared/components/canvas/marquee/index.ts": 'export * from "./marquee"\n',
}

const store = clean["src/shared/config/redux/store.ts"]

export const cases = [
  { id: "I1", files: { "src/shared/components/template/orphan/orphan.tsx": "export function Orphan() { return null }\n" } },
  { id: "I2", files: { "src/features/result/components/result-panel/result-panel.tsx": 'import { useState } from "react"\nexport function ResultPanel() { const [n] = useState(0); return n }\n' } },
  { id: "I4", files: { "src/app/bad/page.tsx": 'import { useAppSelector } from "@shared/config/redux/hooks"\nexport default function Bad() { useAppSelector((s) => s); return null }\n' } },
  { id: "I5", files: { "src/shared/config/redux/store.ts": store.replace(".concat(resultApi.middleware)", "") } },
  { id: "I7", files: { "vitest.config.mts": clean["vitest.config.mts"].replace(', "@public": "/public"', "") } },
  { id: "I8", files: { "src/features/highlight/utils/deep.ts": 'import { HighlightLayer } from "@shared/components/canvas/highlight-layer/highlight-layer"\nexport const x = HighlightLayer\n' } },
  { id: "I9", files: { "src/shared/types/domain/highlights.ts": clean["src/shared/types/domain/highlights.ts"].replace("id: UUID\n", "id: string\n") } },
  { id: "I10", files: { "src/features/highlight/stores/canvas-slice.ts": 'import { createSlice } from "@reduxjs/toolkit"\ntype CanvasState = { tool: { active: string } }\nexport const canvasSlice = createSlice({ name: "canvas", initialState: {} as CanvasState, reducers: {} })\n' } },
  { id: "I11", files: { "src/features/highlight/types/redux.ts": 'import type { Highlight } from "@shared/types/domain/highlights"\n' + clean["src/features/highlight/types/redux.ts"] } },
  { id: "I12", files: { "src/shared/config/redux/persist.ts": clean["src/shared/config/redux/persist.ts"].replace('["canvas"]', '["canvas", "entities"]') } },
  { id: "I14", files: { "src/features/result/components/result-panel/use-result-panel.ts": 'import { useGetRunQuery } from "@feature/result/api/result-api"\nexport function useResultPanel() { const { data } = useGetRunQuery("r1"); return { onGenerate: () => data } }\n' } },
  { id: "I16", files: { "src/shared/config/redux/persist.ts": clean["src/shared/config/redux/persist.ts"].replace("[stripUi]", "[]") } },
  { id: "I17", files: { "src/features/highlight/utils/draw.ts": "export function draw(layer) { layer.batchDraw() }\n" } },
  { id: "I22", files: { "src/features/sync/realtime/channel.ts": "export async function openChannels(supabase, sessionId) {\n  supabase.channel(`ws:${sessionId}`).subscribe()\n  await supabase.realtime.setAuth()\n}\n" } },
  { id: "I24", files: { "src/shared/components/canvas/highlight-layer/highlight-layer.tsx": clean["src/shared/components/canvas/highlight-layer/highlight-layer.tsx"].replace(uc, "") } },
  { id: "I13", files: { "src/features/entities/queries/use-outbox-count.ts": null } },
  { id: "I15", files: { "src/app/api/v1/extra/route.ts": "export async function GET() { return new Response() }\n" } },
  { id: "I25", files: { "src/shared/components/canvas/highlight-layer/highlight-layer.painter.ts": null } },
]
