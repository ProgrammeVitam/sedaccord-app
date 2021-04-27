import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders, HttpResponse} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {catchError, tap} from 'rxjs/operators';
import {ArchiveTransfer} from '../dtos/archive-transfer';
import {SipData} from '../dtos/sip';

@Injectable({
  providedIn: 'root'
})
export class SipService {
  private sipGenerationUrl = 'http://localhost:8080/sip/generate-sync';
  private httpOptions = {
    headers: new HttpHeaders({
      Accept: 'application/octet-stream',
      'Content-Type': 'application/json'
    }),
    observe: 'response',
    responseType: 'blob'
  } as const;

  constructor(private http: HttpClient) {
  }

  generateSip(archiveTransfer: ArchiveTransfer): Observable<HttpResponse<Blob>> {
    return this.http.post(this.sipGenerationUrl, SipData.fromArchiveTransfer(archiveTransfer), this.httpOptions)
    .pipe(
       tap(_ => this.log('generated SIP')),
       catchError(this.handleError<HttpResponse<Blob>>('generateSip', new HttpResponse()))
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
