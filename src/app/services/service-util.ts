import {Observable, of} from 'rxjs';

export class ServiceUtil {
  /**
   * Handle Http operation that failed.
   * Let the app continue.
   * @param operation - name of the operation that failed
   * @param result - optional value to return as the observable result
   */
  static handleError<T>(operation: string = 'operation', result?: T): (error: any) => Observable<T> {
    return (error: any): Observable<T> => {

      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead

      // TODO: better job of transforming error for user consumption
      this.log(`${operation} failed: ${error.message}`);

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

  static log(message: string): void {
    // this.messageService.add(`HeroService: ${message}`);
    console.log(`ArchiveTransferService: ${message}`);
  }
}
