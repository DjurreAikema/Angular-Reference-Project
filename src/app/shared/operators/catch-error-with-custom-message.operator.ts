import {catchError, EMPTY, MonoTypeOperatorFunction, Subject} from 'rxjs';

export function catchErrorWithCustomMessage<T>(
  errorSubject: Subject<string>,
  messageTransform: (err: any) => string
): MonoTypeOperatorFunction<T> {
  return catchError((err: any) => {
    errorSubject.next(messageTransform(err));
    return EMPTY;
  })
}
