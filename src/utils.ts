import { ErrorMessage } from './commands';

export function extractErrorMessage<T extends (...args: any[]) => Promise<any>>(callback: T): T {
  return ((...args) => {
    return callback(...args)
      .catch(captureMessageFromCustomErrorVariants);
  }) as T;
}
function captureMessageFromCustomErrorVariants(error: Error) {
  return error instanceof ErrorMessage
    ? (error as ErrorMessage).message
    : throwError(error)
}
export function raise<E extends new (...args: any[]) => Error>(Constructor: E, ...args: ConstructorParameters<E>): never {
  throw new Constructor(...args);
}

export function throwError(e: Error): never {
  throw e
}

export function assertNeverReached(input?: never): never {
  raise(Error, 'unhandled value: ' + input )
}

export const PLUGIN_NAME = 'otp'

