import { beforeEach, describe, expect, it, vi } from "vitest"
import { ForbiddenError, UnauthorizedError, ValidationError } from "./db/errors"

const mocks = vi.hoisted(() => ({
  requestContext: vi.fn(),
  createWorkspace: vi.fn(),
  requestMiniConclusion: vi.fn(),
  requestResult: vi.fn(),
  subscribeRun: vi.fn(),
}))

vi.mock("./db/client", () => ({ requestContext: mocks.requestContext }))
vi.mock("./db/rpc", () => ({ createWorkspace: mocks.createWorkspace }))
vi.mock("./pipeline/service", () => ({
  requestMiniConclusion: mocks.requestMiniConclusion,
  requestResult: mocks.requestResult,
  subscribeRun: mocks.subscribeRun,
  isResultScope: (v: unknown) => v === "individual" || v === "group",
  isRunMode: (v: unknown) => v === "planning" || v === "descriptive" || v === "visualize",
}))

import { POST as createWorkspaceRoute } from "../app/api/v1/workspaces/route"
import { POST as miniConclusionRoute } from "../app/api/v1/highlights/[id]/mini-conclusion/route"
import { POST as resultsRoute } from "../app/api/v1/workspaces/[id]/results/route"

const req = (body?: unknown) =>
  new Request("http://test/api/v1", { method: "POST", headers: { authorization: "Bearer jwt", "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) })
const ctx = (id: string) => ({ params: Promise.resolve({ id }) })

beforeEach(() => vi.clearAllMocks())

describe("route handlers map typed errors (g2, g4, g5)", () => {
  it("results: a member's group run maps ForbiddenError to 403", async () => {
    mocks.requestContext.mockResolvedValue({ db: {}, profileId: "p1" })
    mocks.requestResult.mockRejectedValue(new ForbiddenError("only the leader can run a group result"))
    const response = await resultsRoute(req({ scope: "group" }), ctx("w1"))
    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({ error: "only the leader can run a group result" })
  })

  it("results: a leader's group run is accepted", async () => {
    mocks.requestContext.mockResolvedValue({ db: {}, profileId: "p1" })
    mocks.requestResult.mockResolvedValue({ id: "r1", status: "pending" })
    const response = await resultsRoute(req({ scope: "group" }), ctx("w1"))
    expect(response.status).toBe(202)
    expect(await response.json()).toEqual({ id: "r1", status: "pending" })
    expect(mocks.requestResult).toHaveBeenCalledWith({}, { sessionId: "w1", scope: "group", mode: undefined }, "p1")
  })

  it("results: an invalid scope is 400 before any service call", async () => {
    mocks.requestContext.mockResolvedValue({ db: {}, profileId: "p1" })
    const response = await resultsRoute(req({ scope: "everyone" }), ctx("w1"))
    expect(response.status).toBe(400)
    expect(mocks.requestResult).not.toHaveBeenCalled()
  })

  it("workspaces: wraps create_workspace and answers 201", async () => {
    mocks.requestContext.mockResolvedValue({ db: {}, profileId: "p1" })
    mocks.createWorkspace.mockResolvedValue({ id: "s1" })
    const response = await createWorkspaceRoute(req({ name: "N", title: "T", goal: "G" }))
    expect(response.status).toBe(201)
    expect(await response.json()).toEqual({ id: "s1" })
  })

  it("mini-conclusion: answers 202 with the service status", async () => {
    mocks.requestContext.mockResolvedValue({ db: {}, profileId: "p1" })
    mocks.requestMiniConclusion.mockResolvedValue({ status: "queued" })
    const response = await miniConclusionRoute(req(), ctx("h1"))
    expect(response.status).toBe(202)
    expect(await response.json()).toEqual({ status: "queued" })
  })

  it("any route without a bearer is 401", async () => {
    mocks.requestContext.mockRejectedValue(new UnauthorizedError())
    expect((await miniConclusionRoute(req(), ctx("h1"))).status).toBe(401)
  })

  it("a validation failure from a service maps to 400", async () => {
    mocks.requestContext.mockResolvedValue({ db: {}, profileId: "p1" })
    mocks.createWorkspace.mockRejectedValue(new ValidationError("name, title and goal are required"))
    expect((await createWorkspaceRoute(req({ name: "", title: "", goal: "" }))).status).toBe(400)
  })
})
