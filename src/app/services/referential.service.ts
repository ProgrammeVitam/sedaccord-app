import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {catchError, tap} from 'rxjs/operators';
import {Agency, Classification} from '../dtos/referential';

@Injectable({
  providedIn: 'root'
})
export class ReferentialService {
  private agenciesUrl = 'api/agencies';  // URL to web api
  private classificationUrl = 'api/classification';  // URL to web api

  constructor(private http: HttpClient) {
  }

  getAgencies(): Observable<Agency[]> {
    return this.http.get<Agency[]>(this.agenciesUrl)
      .pipe(
        tap(_ => this.log('fetched agencies')),
        catchError(this.handleError<Agency[]>('getAgencies', []))
      );
  }

  getClassification(): Observable<Classification> {
    return this.http.get<Classification>(this.classificationUrl)
      .pipe(
        tap(_ => this.log('fetched classification')),
        catchError(this.handleError<Classification>('getClassification', []))
      );
  }

  /**
   * Handle Http operation that failed.
   * Let the app continue.
   * @param operation - name of the operation that failed
   * @param result - optional value to return as the observable result
   */
  private handleError<T>(operation: string = 'operation', result?: T): (error: any) => Observable<T> {
    return (error: any): Observable<T> => {

      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead

      // TODO: better job of transforming error for user consumption
      this.log(`${operation} failed: ${error.message}`);

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

  private log(message: string): void {
    // this.messageService.add(`HeroService: ${message}`);
    console.log(`ArchiveTransferService: ${message}`);
  }
}
