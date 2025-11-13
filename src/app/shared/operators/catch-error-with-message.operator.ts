import {catchError, EMPTY, MonoTypeOperatorFunction, Subject} from 'rxjs';

export function catchErrorWithMessage<T>(
  errorSubject: Subject<string>,
  defaultMessage: string
): MonoTypeOperatorFunction<T> {
  return catchError((err: any) => {
    errorSubject.next(err.message || defaultMessage);
    return EMPTY;
  });
}
