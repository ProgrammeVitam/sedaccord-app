import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {ArchiveTransfer} from '../dtos/archive-transfer';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {catchError, map, tap} from 'rxjs/operators';
import {FileComment} from '../dtos/file';

@Injectable({
  providedIn: 'root'
})
export class ArchiveTransferService {
  private archiveTransfersUrl = 'api/archiveTransfers';  // URL to web api
  private commentsUrl = 'api/comments';  // URL to web api
  private httpOptions = {
    headers: new HttpHeaders({'Content-Type': 'application/json'})
  };

  constructor(private http: HttpClient) {
  }

  getArchiveTransfers(): Observable<ArchiveTransfer[]> {
    return this.http.get<ArchiveTransfer[]>(this.archiveTransfersUrl)
      .pipe(
        map(value => {
          const archiveTransfers = [];
          for (const element of value) {
            // TODO builder
            const archiveTransfer = new ArchiveTransfer(
              element.id,
              element.name,
              element.description,
              element.startDate,
              element.endDate,
              element.transferringAgency,
              element.creator
            );
            for (const archiveDataPackage of element.archiveDataPackages) {
              archiveTransfer.addPackage(
                archiveDataPackage.id,
                archiveDataPackage.name,
                archiveDataPackage.classificationItem,
                archiveDataPackage.fileTreeData
              );
            }
            archiveTransfers.push(archiveTransfer);
          }
          return archiveTransfers;
        }),
        tap(_ => this.log('fetched archive transfers')),
        catchError(this.handleError<ArchiveTransfer[]>('getArchiveTransfers', []))
      );
  }

  getArchiveTransfer(id: number): Observable<ArchiveTransfer> {
    const url = `${this.archiveTransfersUrl}/${id}`;
    return this.http.get<ArchiveTransfer>(url)
      .pipe(
        map(value => {
          // TODO builder + do it for each service
          const archiveTransfer = new ArchiveTransfer(
            value.id,
            value.name,
            value.description,
            value.startDate,
            value.endDate,
            value.transferringAgency,
            value.creator
          );
          for (const archiveDataPackage of value.archiveDataPackages) {
            archiveTransfer.addPackage(
              archiveDataPackage.id,
              archiveDataPackage.name,
              archiveDataPackage.classificationItem,
              archiveDataPackage.fileTreeData
            );
          }
          return archiveTransfer;
        }),
        tap(_ => this.log(`fetched archive transfer id=${id}`)),
        catchError(this.handleError<ArchiveTransfer>(`getArchiveTransfer id=${id}`))
      );
  }

  updateArchiveTransfer(archiveTransfer: ArchiveTransfer): Observable<any> {
    return this.http.put(this.archiveTransfersUrl, archiveTransfer, this.httpOptions)
      .pipe(
        tap(_ => this.log(`updated archive transfer id=${archiveTransfer.id}`)),
        catchError(this.handleError<any>('updateArchiveTransfer'))
      );
  }

  addArchiveTransfer(archiveTransfer: ArchiveTransfer): Observable<ArchiveTransfer> {
    return this.http.post<ArchiveTransfer>(this.archiveTransfersUrl, archiveTransfer, this.httpOptions)
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

  getComments(file: string): Observable<FileComment[]> {
    return this.http.get<FileComment[]>(this.commentsUrl) // TODO back end query
      .pipe(
        map(value => value.filter(element => element.file === file)),
        tap(_ => this.log(`fetched comments for file name=${file}`)),
        catchError(this.handleError<FileComment[]>(`getComments file name=${file}`))
      );
  }

  addComment(comment: FileComment): Observable<FileComment> {
    return this.http.post<FileComment>(this.commentsUrl, comment, this.httpOptions)
      .pipe(
        tap((newComment: FileComment) => this.log(`added comment for file=${newComment.file}`)),
        catchError(this.handleError<FileComment>('addComment'))
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
