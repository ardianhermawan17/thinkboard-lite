// The result engine's stage registry (RULE-21: a new stage is one file + one registry entry + one transition
// test). Empty until 020 registers scope_anchor -> analytic -> result.

export type StageContext = { runId: string; signal: AbortSignal }

export type Stage<Input = unknown, Output = unknown> = {
  name: string
  run(input: Input, context: StageContext): Promise<Output>
}

const registry = new Map<string, Stage>()

export function registerStage(stage: Stage): void {
  registry.set(stage.name, stage)
}

export function stages(): Stage[] {
  return [...registry.values()]
}

export function clearStages(): void {
  registry.clear()
}
