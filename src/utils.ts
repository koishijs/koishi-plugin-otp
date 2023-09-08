import { Argv, Session } from "koishi";

export class ErrorMessage extends Error {
  name = 'Recoverable Error'
}
export class ErrorMessageKey extends Error {
  name = 'Recoverable Error (raw key)'
}

export function extractErrorMessage<TArgV extends Argv<any,any, any, any>, T extends (...args: [TArgV, ...any[]]) => any>(callback: T): T
export function extractErrorMessage<TArgV extends Argv<any,any, any, any>, T extends (...args: [TArgV, ...any[]]) => Promise<any>>(callback: T): T {
  return ((argv, ...args) => {
    let maybeAsync: undefined | {} | Promise<unknown> = undefined
    const _capture = captureMessageFromCustomErrorVariants.bind(null, argv.session)
    try {
      maybeAsync = callback(argv, ...args)
    } catch (e) {
      return _capture(e)
    }
    return (
      maybeAsync && typeof (maybeAsync as Promise<unknown>).catch == 'function'
      ? (maybeAsync as Promise<unknown>).catch(_capture)
      : maybeAsync
    )
  }) as T;
}
function captureMessageFromCustomErrorVariants(session: Session<any, any> | undefined, error: Error) {
  return error instanceof ErrorMessage
    ? (error as ErrorMessage).message
    : error instanceof ErrorMessageKey
    ? session?.text((error as ErrorMessageKey).message) ?? (error as ErrorMessageKey).message
    : throwError(error, captureMessageFromCustomErrorVariants)
}
export function raise<E extends new (...args: any[]) => Error>(EC: E, ...args: ConstructorParameters<E>): never {
  const error = new EC(...args);
  Error.captureStackTrace(error, raise);
  throw error;
}

export function throwError(raisedError: Error, stackCapture: CallableFunction = this.caller): never {
  Error.captureStackTrace(raisedError, stackCapture);
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
