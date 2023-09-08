import { ErrorMessage } from './commands';

export function extractErrorMessage<T extends (...args: any[]) => any>(callback: T): T
export function extractErrorMessage<T extends (...args: any[]) => Promise<any>>(callback: T): T {
  return ((...args) => {
    let maybeAsync: undefined | {} | Promise<unknown> = undefined
    try {
      maybeAsync = callback(...args)
    } catch (e) {
      captureMessageFromCustomErrorVariants(e)
    }
    return (
      maybeAsync
      && typeof (maybeAsync as Promise<unknown>).catch == 'function'
      && (maybeAsync as Promise<unknown>).catch(captureMessageFromCustomErrorVariants),

      maybeAsync
    )
  }) as T;
}
function captureMessageFromCustomErrorVariants(error: Error) {
  return error instanceof ErrorMessage
    ? (error as ErrorMessage).message
    : throwError(error)
}
export function raise<E extends new (...args: any[]) => Error>(EC: E, ...args: ConstructorParameters<E>): never {
  const error = new EC(...args);
  Error.captureStackTrace(error, raise);
  throw error;
}

export function throwError(raisedError: Error): never {
  Error.captureStackTrace(raisedError, throwError);
  throw raisedError;
}

export function assertNeverReached(input?: never): never {
  raise(Error, 'unhandled value: ' + input)
}

export const PLUGIN_NAME = 'otp'

export function commandLocaleGen(desc, option?) {
  let result = {
    [desc._name]: {
      description: desc._root
    }
  }
  for (let key in desc) {
    if (key === '_root') continue
    if (key === '_name') continue
    result[desc._name][key] = {
      description: desc[key],
      options: option ? option[key] : undefined
    }
  }
  return result
}
