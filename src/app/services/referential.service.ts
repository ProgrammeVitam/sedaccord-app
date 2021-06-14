import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {catchError, tap} from 'rxjs/operators';
import {Agency, Classification} from '../dtos/referential';
import {ServiceUtil} from './service-util';

@Injectable({
  providedIn: 'root'
})
export class ReferentialService {
  private agenciesUrl = 'api/agencies';
  private classificationUrl = 'api/classification';

  constructor(private http: HttpClient) {
  }

  getAgencies(): Observable<Agency[]> {
    return this.http.get<Agency[]>(this.agenciesUrl)
      .pipe(
        tap(_ => ServiceUtil.log('fetched agencies')),
        catchError(ServiceUtil.handleError<Agency[]>('getAgencies', []))
      );
  }

  getClassification(): Observable<Classification> {
    return this.http.get<Classification>(this.classificationUrl)
      .pipe(
        tap(_ => ServiceUtil.log('fetched classification')),
        catchError(ServiceUtil.handleError<Classification>('getClassification', []))
      );
  }
}
