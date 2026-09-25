import { requestContext } from "../../../../server/db/client"
import { ValidationError } from "../../../../server/db/errors"
import { createWorkspace } from "../../../../server/db/rpc"
import { errorResponse, json } from "../../../../server/http"

/** POST /api/v1/workspaces (blueprint command `create-workspace`) — wraps create_workspace, returns its id. */
export async function POST(request: Request) {
  try {
    const { db } = await requestContext(request)
    const body = (await request.json().catch(() => null)) as { name?: unknown; title?: unknown; goal?: unknown } | null
    if (!body) throw new ValidationError("a JSON body is required")
    const created = await createWorkspace(db, { name: String(body.name ?? ""), title: String(body.title ?? ""), goal: String(body.goal ?? "") })
    return json(created, 201)
  } catch (error) {
    return errorResponse(error)
  }
}
