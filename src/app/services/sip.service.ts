import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders, HttpResponse} from '@angular/common/http';
import {Observable} from 'rxjs';
import {catchError, tap} from 'rxjs/operators';
import {ArchiveTransfer} from '../dtos/archive-transfer';
import {SipData} from '../dtos/sip';
import {ServiceUtil} from './service-util';

const SERVER_URL = 'http://localhost:8080';

@Injectable({
  providedIn: 'root'
})
export class SipService {
  private sipHealthCheckUrl = `${SERVER_URL}/actuator/health`;
  private sipGenerationUrl = `${SERVER_URL}/sip/generate-sync`;
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

  isAvailable(): Observable<any> {
    return this.http.get(this.sipHealthCheckUrl)
      .pipe(
        tap(_ => ServiceUtil.log('trying to reach SIP service'))
      );
  }

  generateSip(archiveTransfer: ArchiveTransfer): Observable<HttpResponse<Blob>> {
    return this.http.post(this.sipGenerationUrl, SipData.fromArchiveTransfer(archiveTransfer), this.httpOptions)
      .pipe(
        tap(_ => ServiceUtil.log('generated SIP')),
        catchError(ServiceUtil.handleError<HttpResponse<Blob>>('generateSip', new HttpResponse()))
      );
  }
}
