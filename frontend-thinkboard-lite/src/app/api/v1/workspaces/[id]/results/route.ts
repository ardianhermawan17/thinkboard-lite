import { requestContext } from "../../../../../../server/db/client"
import { ValidationError } from "../../../../../../server/db/errors"
import { errorResponse, json } from "../../../../../../server/http"
import { isResultScope, isRunMode, requestResult } from "../../../../../../server/pipeline/service"

/** POST /api/v1/workspaces/:id/results (blueprint command `generate-result`) — the leader rule lives in the service. */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { db, profileId } = await requestContext(request)
    const { id } = await context.params
    const body = (await request.json().catch(() => null)) as { scope?: unknown; mode?: unknown } | null
    const scope = body?.scope
    if (!isResultScope(scope)) throw new ValidationError("scope must be 'individual' or 'group'")
    const mode = body && isRunMode(body.mode) ? body.mode : undefined
    return json(await requestResult(db, { sessionId: id, scope, mode }, profileId), 202)
  } catch (error) {
    return errorResponse(error)
  }
}
