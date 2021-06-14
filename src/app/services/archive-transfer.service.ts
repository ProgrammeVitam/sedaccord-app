import {Injectable} from '@angular/core';
import {forkJoin, Observable} from 'rxjs';
import {ArchiveTransfer, ArchiveTransferInterface, ArchiveTransferStatus} from '../dtos/archive-transfer';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {catchError, map, mapTo, switchMap, tap} from 'rxjs/operators';
import {UserRole} from '../dtos/user';
import {MessageService} from './message.service';
import {MessageType} from '../dtos/message';
import {ServiceUtil} from './service-util';

@Injectable({
  providedIn: 'root'
})
export class ArchiveTransferService {
  private archiveTransfersUrl = 'api/archiveTransfers';
  private httpOptions = {
    headers: new HttpHeaders({'Content-Type': 'application/json'})
  };

  constructor(private http: HttpClient, private _messageService: MessageService) {
  }

  getArchiveTransfers(): Observable<ArchiveTransfer[]> { // TODO return partial objects?
    return this.http.get<ArchiveTransferInterface[]>(this.archiveTransfersUrl)
      .pipe(
        map(value => value.map(element => new ArchiveTransfer(element.submissionUserId).fromObject(element))),
        tap(_ => ServiceUtil.log('fetched archive transfers')),
        catchError(ServiceUtil.handleError<ArchiveTransfer[]>('getArchiveTransfers', []))
      );
  }

  getArchiveTransfer(id: number): Observable<ArchiveTransfer> {
    const url = `${this.archiveTransfersUrl}/${id}`;
    return this.http.get<ArchiveTransferInterface>(url)
      .pipe(
        map(value => new ArchiveTransfer(value.submissionUserId).fromObject(value)),
        tap(_ => ServiceUtil.log(`fetched archive transfer id=${id}`)),
        catchError(ServiceUtil.handleError<ArchiveTransfer>(`getArchiveTransfer id=${id}`))
      );
  }

  findArchiveTransfersForUser(submissionUserId: number, userRole: UserRole): Observable<ArchiveTransfer[]> {
    if (userRole === 'ARCHIVE') {
      return forkJoin(
        [this._findArchiveTransfersBySubmissionUser(submissionUserId), this._findArchiveTransfersByStatus('En attente de correction')]
      ).pipe(
        map(value => value.flat())
      );
    }
    return this._findArchiveTransfersBySubmissionUser(submissionUserId);
  }

  updateArchiveTransfer(archiveTransfer: ArchiveTransfer, message: MessageType = 'UPDATED_ARCHIVE_TRANSFER'): Observable<ArchiveTransfer> {
    archiveTransfer.update();
    return this.http.put<ArchiveTransfer>(this.archiveTransfersUrl, archiveTransfer.toInterface(), this.httpOptions)
      .pipe(
        switchMap(updatedArchiveTransfer =>
          this._messageService.addMessage(updatedArchiveTransfer.id, message).pipe(
            mapTo(updatedArchiveTransfer))
        ),
        tap(_ => ServiceUtil.log(`updated archive transfer id=${archiveTransfer.id}`)),
        catchError(ServiceUtil.handleError<any>('updateArchiveTransfer'))
      );
  }

  addArchiveTransfer(archiveTransfer: ArchiveTransfer): Observable<ArchiveTransfer> {
    return this.http.post<ArchiveTransfer>(this.archiveTransfersUrl, archiveTransfer.toInterface(), this.httpOptions)
      .pipe(
        tap((newArchiveTransfer: ArchiveTransfer) => ServiceUtil.log(`added archive transfer w/ id=${newArchiveTransfer.id}`)),
        catchError(ServiceUtil.handleError<ArchiveTransfer>('addArchiveTransfer'))
      );
  }

  deleteArchiveTransfer(archiveTransfer: ArchiveTransfer | number): Observable<ArchiveTransfer> {
    const id = typeof archiveTransfer === 'number' ? archiveTransfer : archiveTransfer.id;
    const url = `${this.archiveTransfersUrl}/${id}`;
    return this.http.delete<ArchiveTransfer>(url, this.httpOptions).pipe(
      tap(_ => ServiceUtil.log(`deleted archive transfer id=${id}`)),
      catchError(ServiceUtil.handleError<ArchiveTransfer>('deleteArchiveTransfer'))
    );
  }

  private _findArchiveTransfersBySubmissionUser(submissionUserId: number): Observable<ArchiveTransfer[]> {
    const url = `${this.archiveTransfersUrl}/?submissionUserId=${submissionUserId}`;
    return this.http.get<ArchiveTransferInterface[]>(url)
      .pipe(
        map(value => value.map(element => new ArchiveTransfer(element.submissionUserId).fromObject(element))),
        tap(value => value.length ?
          ServiceUtil.log(`found archive transfers which submission user id matching "${submissionUserId}"`) : ServiceUtil.log(`no archive transfers which submission user id matching "${submissionUserId}"`)),
        catchError(ServiceUtil.handleError<ArchiveTransfer[]>(`findArchiveTransfersBySubmissionUser submissionUserId=${submissionUserId}`, []))
      );
  }

  private _findArchiveTransfersByStatus(status: ArchiveTransferStatus): Observable<ArchiveTransfer[]> {
    const url = `${this.archiveTransfersUrl}/?status=${status}`;
    return this.http.get<ArchiveTransferInterface[]>(url)
      .pipe(
        map(value => value.map(element => new ArchiveTransfer(element.submissionUserId).fromObject(element))),
        tap(value => value.length ?
          ServiceUtil.log(`found archive transfers which status matching "${status}"`) : ServiceUtil.log(`no archive transfers which status matching "${status}"`)),
        catchError(ServiceUtil.handleError<ArchiveTransfer[]>(`findArchiveTransfersByStatus status=${status}`, []))
      );
  }
}
