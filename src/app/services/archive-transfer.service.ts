import {Injectable} from '@angular/core';
import {forkJoin, Observable, of} from 'rxjs';
import {ArchiveTransfer, ArchiveTransferInterface, ArchiveTransferStatus} from '../dtos/archive-transfer';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {catchError, map, tap} from 'rxjs/operators';
import {UserRole} from '../dtos/user';

@Injectable({
  providedIn: 'root'
})
export class ArchiveTransferService {
  private archiveTransfersUrl = 'api/archiveTransfers';  // URL to web api
  private httpOptions = {
    headers: new HttpHeaders({'Content-Type': 'application/json'})
  };

  constructor(private http: HttpClient) {
  }

  getArchiveTransfers(): Observable<ArchiveTransfer[]> { // TODO return partial objects?
    return this.http.get<ArchiveTransferInterface[]>(this.archiveTransfersUrl)
      .pipe(
        map(value => value.map(element => new ArchiveTransfer().fromObject(element))),
        tap(_ => this.log('fetched archive transfers')),
        catchError(this.handleError<ArchiveTransfer[]>('getArchiveTransfers', []))
      );
  }

  getArchiveTransfer(id: number): Observable<ArchiveTransfer> {
    const url = `${this.archiveTransfersUrl}/${id}`;
    return this.http.get<ArchiveTransferInterface>(url)
      .pipe(
        map(value => new ArchiveTransfer().fromObject(value)),
        tap(_ => this.log(`fetched archive transfer id=${id}`)),
        catchError(this.handleError<ArchiveTransfer>(`getArchiveTransfer id=${id}`))
      );
  }

  findArchiveTransfersForUser(submissionUserId: number, userRole: UserRole): Observable<ArchiveTransfer[]> {
    if (userRole === 'archive') {
      return forkJoin(
        [this._findArchiveTransfersBySubmissionUser(submissionUserId), this._findArchiveTransfersByStatus('En attente de correction')]
      ).pipe(
        map(value => value.flat())
      );
    }
    return this._findArchiveTransfersBySubmissionUser(submissionUserId);
  }

  private _findArchiveTransfersBySubmissionUser(submissionUserId: number): Observable<ArchiveTransfer[]> {
    const url = `${this.archiveTransfersUrl}/?submissionUserId=${submissionUserId}`;
    return this.http.get<ArchiveTransferInterface[]>(url)
      .pipe(
        map(value => value.map(element => new ArchiveTransfer().fromObject(element))),
        tap(value => value.length ?
          this.log(`found archive transfers which submission user id matching "${submissionUserId}"`) : this.log(`no archive transfers which submission user id matching "${submissionUserId}"`)),
        catchError(this.handleError<ArchiveTransfer[]>(`findArchiveTransfersBySubmissionUser submissionUserId=${submissionUserId}`, []))
      );
  }

  private _findArchiveTransfersByStatus(status: ArchiveTransferStatus): Observable<ArchiveTransfer[]> {
    const url = `${this.archiveTransfersUrl}/?status=${status}`;
    return this.http.get<ArchiveTransferInterface[]>(url)
      .pipe(
        map(value => value.map(element => new ArchiveTransfer().fromObject(element))),
        tap(value => value.length ?
          this.log(`found archive transfers which status matching "${status}"`) : this.log(`no archive transfers which status matching "${status}"`)),
        catchError(this.handleError<ArchiveTransfer[]>(`findArchiveTransfersByStatus status=${status}`, []))
      );
  }

  updateArchiveTransfer(archiveTransfer: ArchiveTransfer): Observable<ArchiveTransfer> {
    return this.http.put<ArchiveTransfer>(this.archiveTransfersUrl, archiveTransfer.toInterface(), this.httpOptions)
      .pipe(
        tap(_ => this.log(`updated archive transfer id=${archiveTransfer.id}`)),
        catchError(this.handleError<any>('updateArchiveTransfer'))
      );
  }

  addArchiveTransfer(archiveTransfer: ArchiveTransfer): Observable<ArchiveTransfer> {
    return this.http.post<ArchiveTransfer>(this.archiveTransfersUrl, archiveTransfer.toInterface(), this.httpOptions)
      .pipe(
        tap((newArchiveTransfer: ArchiveTransfer) => this.log(`added archive transfer w/ id=${newArchiveTransfer.id}`)),
        catchError(this.handleError<ArchiveTransfer>('addArchiveTransfer'))
      );
  }

  deleteArchiveTransfer(archiveTransfer: ArchiveTransfer | number): Observable<ArchiveTransfer> {
    const id = typeof archiveTransfer === 'number' ? archiveTransfer : archiveTransfer.id;
    const url = `${this.archiveTransfersUrl}/${id}`;

    return this.http.delete<ArchiveTransfer>(url, this.httpOptions).pipe(
      tap(_ => this.log(`deleted archive transfer id=${id}`)),
      catchError(this.handleError<ArchiveTransfer>('deleteArchiveTransfer'))
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
