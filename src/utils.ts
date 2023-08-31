import { ErrorMessage } from './commands';

export function extractErrorMessage<T extends (...args: any[]) => any>(callback: T): T {
  return ((...args) => {
    return callback(...args)
      .catch(captureError);
  }) as T;
}
function captureError(error: unknown) {
  switch (true) {
    case error instanceof ErrorMessage: {
      return (error as ErrorMessage).message;
    }
  }
}
export function raise<E extends new (...args: any[]) => Error>(Constructor: E, ...args: ConstructorParameters<E>): never {
  throw new Constructor(...args);
}
