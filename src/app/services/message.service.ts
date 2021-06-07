import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {forkJoin, Observable, of} from 'rxjs';
import {catchError, defaultIfEmpty, map, mapTo, switchMap, tap} from 'rxjs/operators';
import {AuthService} from './auth.service';

export type MessageType = 'SUBMITTED_ARCHIVE_TRANSFER' | 'UPDATED_ARCHIVE_TRANSFER';

export interface Message {
  id: number;
  archiveTransferId: number;
  creationUserId: number;
  type: MessageType;
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private messagesUrl = 'api/messages';  // URL to web api
  private httpOptions = {
    headers: new HttpHeaders({'Content-Type': 'application/json'})
  };

  constructor(private http: HttpClient, private _authService: AuthService) {
  }

  getLatestMessagesForUser(archiveTransferIds: number[], userId: number): Observable<Message[]> {
    return this._findMessagesByArchiveTransfer(archiveTransferIds).pipe(
      map(messages => messages.filter(message => message.creationUserId !== userId)), // FIXME put it directly in find method
      switchMap(messages => forkJoin(
        messages.map(message => this._deleteMessage(message).pipe(
          mapTo(message))
        ))
      ),
      defaultIfEmpty([] as Message[])
    );
  }

  private _findMessagesByArchiveTransfer(archiveTransferIds: number[]): Observable<Message[]> {
    const url = `${this.messagesUrl}/?archiveTransferId=${archiveTransferIds.join('|')}`;
    return this.http.get<Message[]>(url)
      .pipe(
        tap(value => value.length ?
          this.log(`found messages which archive transfer ids matching "${archiveTransferIds}"`) : this.log(`no message which archive transfer ids matching "${archiveTransferIds}"`)),
        catchError(this.handleError<Message[]>(`findMessagesBySubmissionUser archiveTransferIds=${archiveTransferIds}`, []))
      );
  }

  addMessage(archiveTransferId: number, type: MessageType): Observable<Message> {
    return this.http.post<Message>(this.messagesUrl, {
      archiveTransferId,
      creationUserId: this._authService.getCurrentUserValue().id,
      type
    }, this.httpOptions)
      .pipe(
        tap((message: Message) => this.log(`added message w/ id=${message.id}`)),
        catchError(this.handleError<Message>('addMessage'))
      );
  }

  private _deleteMessage(message: Message | number): Observable<Message> {
    const id = typeof message === 'number' ? message : message.id;
    const url = `${this.messagesUrl}/${id}`;

    return this.http.delete<Message>(url, this.httpOptions).pipe(
      tap(_ => this.log(`deleted message id=${id}`)),
      catchError(this.handleError<Message>('deleteMessage'))
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
