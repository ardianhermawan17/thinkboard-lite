import type { UUID } from "@shared/types/domain/common"

/**
 * The seam 018 fills (spec §4.2; 018 g1). It takes a profileId, NEVER a key: key resolution lives in
 * `llm/vault.ts` and nowhere else (RULE-24). Until 018 lands, calling it is an explicit, typed refusal rather
 * than a silent no-op, so a run that needs a model fails loudly instead of pretending to have one.
 */
export type LlmMessage = { role: "system" | "user" | "assistant"; content: string }

export type CompletionRequest = { profileId: UUID<"profiles">; messages: LlmMessage[]; signal?: AbortSignal }
export type CompletionResult = { text: string; provider: string }

export type LlmService = {
  complete(request: CompletionRequest): Promise<CompletionResult>
  stream(request: CompletionRequest): AsyncIterable<string>
}

export class LlmUnavailableError extends Error {
  constructor(message = "no LLM provider is configured yet") {
    super(message)
    this.name = "LlmUnavailableError"
  }
}

/** Replaced by 018's provider-rotating adapter; the interface is the contract, the stub is not. */
export const llmService: LlmService = {
  async complete(): Promise<CompletionResult> {
    throw new LlmUnavailableError()
  },
  async *stream(): AsyncIterable<string> {
    throw new LlmUnavailableError()
  },
}
