/** The `meta` keys (DB-Q12: non-mirrored rows pulled by the sync engine, read by named hooks). One home, shared by sync and the contexts. */
export const META = {
  team: "team",
  members: "members",
  session: "session",
  teamPersona: "teamPersona",
  userPersona: "userPersona",
  llmProviders: "llmProviders",
  llmModels: "llmModels",
  memoryEntries: "memoryEntries",
} as const

/** The first-open guard (05 §2.1): present only once every page of the bootstrap landed. */
export const bootstrappedKey = (sessionId: string) => `bootstrapped:${sessionId}`
