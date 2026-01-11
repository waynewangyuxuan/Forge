/**
 * Type-safe IPC invoke wrapper
 * Provides compile-time safety for IPC calls using IPCChannelMap
 */

import type { IPCChannelMap, IPCResult } from '@shared/types/ipc.types'

/**
 * Type-safe IPC invoke
 * Usage: const result = await invokeTyped('project:delete', { id, ... })
 *
 * @param channel - The IPC channel to invoke
 * @param input - The input data (type-checked against IPCChannelMap)
 * @returns Promise resolving to the output type for this channel
 */
export async function invokeTyped<K extends keyof IPCChannelMap>(
  channel: K,
  input: IPCChannelMap[K]['input']
): Promise<IPCChannelMap[K]['output']> {
  return window.api.invoke(channel, input) as Promise<IPCChannelMap[K]['output']>
}

/**
 * Unwrap an IPCResult, throwing if not ok
 * Use this when you want try/catch error handling
 *
 * @param result - The IPCResult to unwrap
 * @returns The data if ok, throws if not ok
 */
export function unwrapResult<T>(result: IPCResult<T>): T {
  if (!result.ok) {
    const err = new Error(result.error.message) as Error & {
      code: string
      details?: Record<string, unknown>
    }
    err.code = result.error.code
    err.details = result.error.details
    throw err
  }
  return result.data
}
