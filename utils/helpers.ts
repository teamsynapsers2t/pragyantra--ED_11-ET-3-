import { createHash } from 'crypto'

/**
 * Deterministically formats a Clerk user ID string into a UUID format using MD5 hashing.
 * This is useful for inserting into Supabase tables where user_id has UUID type constraints.
 */
export function clerkIdToUuid(clerkId: string): string {
  if (!clerkId) {
    return '00000000-0000-0000-0000-000000000000'
  }
  const hash = createHash('md5').update(clerkId).digest('hex')
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    hash.substring(12, 16),
    hash.substring(16, 20),
    hash.substring(20, 32)
  ].join('-')
}

/**
 * Deterministically parses a string-based session ID into a BigInt.
 * Extracts digits if present, or hashes the string to fit inside a signed 64-bit bigint.
 */
export function parseSessionIdToBigInt(sessionId: string): bigint {
  if (!sessionId) {
    return BigInt(0)
  }
  const match = sessionId.match(/\d+/)
  if (match) {
    try {
      return BigInt(match[0])
    } catch {
      // Fallback if the extracted number is larger than max bigint
    }
  }
  const hash = createHash('md5').update(sessionId).digest('hex')
  const hex64 = hash.substring(0, 15) // 15 hex characters fits safely in signed 64-bit integer
  return BigInt(`0x${hex64}`)
}
