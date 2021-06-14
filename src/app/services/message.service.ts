import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {forkJoin, Observable} from 'rxjs';
import {catchError, defaultIfEmpty, map, mapTo, switchMap, tap} from 'rxjs/operators';
import {AuthService} from './auth.service';
import {Message, MessageType} from '../dtos/message';
import {ServiceUtil} from './service-util';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private messagesUrl = 'api/messages';
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

  addMessage(archiveTransferId: number, type: MessageType): Observable<Message> {
    return this.http.post<Message>(this.messagesUrl, {
      archiveTransferId,
      creationUserId: this._authService.getCurrentUserValue().id,
      type
    }, this.httpOptions)
      .pipe(
        tap((message: Message) => ServiceUtil.log(`added message w/ id=${message.id}`)),
        catchError(ServiceUtil.handleError<Message>('addMessage'))
      );
  }

  private _findMessagesByArchiveTransfer(archiveTransferIds: number[]): Observable<Message[]> {
    const url = `${this.messagesUrl}/?archiveTransferId=${archiveTransferIds.join('|')}`;
    return this.http.get<Message[]>(url)
      .pipe(
        tap(value => value.length ?
          ServiceUtil.log(`found messages which archive transfer ids matching "${archiveTransferIds}"`) : ServiceUtil.log(`no message which archive transfer ids matching "${archiveTransferIds}"`)),
        catchError(ServiceUtil.handleError<Message[]>(`findMessagesBySubmissionUser archiveTransferIds=${archiveTransferIds}`, []))
      );
  }

  private _deleteMessage(message: Message | number): Observable<Message> {
    const id = typeof message === 'number' ? message : message.id;
    const url = `${this.messagesUrl}/${id}`;

    return this.http.delete<Message>(url, this.httpOptions).pipe(
      tap(_ => ServiceUtil.log(`deleted message id=${id}`)),
      catchError(ServiceUtil.handleError<Message>('deleteMessage'))
    );
  }
}
