// KERNEL A: the Dexie mirror of the database, and the only read surface for domain rows (04 §4.1).
// Every other feature imports THIS barrel, never a file inside it.
export * from "./db"
export * from "./queries"
export * from "./repository"
export type * from "./types"
export { localTable, toRow, toWire, wireTable } from "./utils/mappers"
export { META, bootstrappedKey } from "./utils/meta-keys"
export { uuidv7 } from "./utils/uuid7"
