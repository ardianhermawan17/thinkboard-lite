import { requestContext } from "../../../../../../server/db/client"
import { errorResponse, json } from "../../../../../../server/http"
import { requestMiniConclusion } from "../../../../../../server/pipeline/service"

/** POST /api/v1/highlights/:id/mini-conclusion (blueprint command `mini-conclusion`) — idempotent, returns a status. */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { db } = await requestContext(request)
    const { id } = await context.params
    return json(await requestMiniConclusion(db, { highlightId: id }), 202)
  } catch (error) {
    return errorResponse(error)
  }
}
