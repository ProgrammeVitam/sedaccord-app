import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {ClassificationItemNode, Office} from '../dtos/archive-transfer';
import {HttpClient} from '@angular/common/http';
import {catchError, tap} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RepositoryService {
  private transferringAgenciesUrl = 'api/transferringAgencies';  // URL to web api
  private creatorsUrl = 'api/creators';  // URL to web api
  private classificationUrl = 'api/classification';  // URL to web api

  constructor(private http: HttpClient) {
  }

  getTransferringAgencies(): Observable<Office[]> {
    return this.http.get<Office[]>(this.transferringAgenciesUrl)
      .pipe(
        tap(_ => this.log('fetched transferring agencies')),
        catchError(this.handleError<Office[]>('getTransferringAgencies', []))
      );
  }

  getTransferringAgency(id: number): Observable<Office> {
    const url = `${this.transferringAgenciesUrl}/${id}`;
    return this.http.get<Office>(url)
      .pipe(
        tap(_ => this.log(`fetched transferring agency id=${id}`)),
        catchError(this.handleError<Office>(`getTransferringAgency id=${id}`))
      );
  }

  getCreators(): Observable<Office[]> {
    return this.http.get<Office[]>(this.creatorsUrl)
      .pipe(
        tap(_ => this.log('fetched creators')),
        catchError(this.handleError<Office[]>('getCreators', []))
      );
  }

  getCreator(id: number): Observable<Office> {
    const url = `${this.creatorsUrl}/${id}`;
    return this.http.get<Office>(url)
      .pipe(
        tap(_ => this.log(`fetched creator id=${id}`)),
        catchError(this.handleError<Office>(`getCreator id=${id}`))
      );
  }

  getClassification(): Observable<ClassificationItemNode[]> {
    return this.http.get<ClassificationItemNode[]>(this.classificationUrl)
      .pipe(
        tap(_ => this.log('fetched classification')),
        catchError(this.handleError<ClassificationItemNode[]>('getClassification', []))
      );
  }

  getClassificationItem(id: number): Observable<ClassificationItemNode> {
    const url = `${this.classificationUrl}/${id}`;
    return this.http.get<ClassificationItemNode>(url)
      .pipe(
        tap(_ => this.log(`fetched classification item id=${id}`)),
        catchError(this.handleError<ClassificationItemNode>(`getClassificationItem id=${id}`))
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
