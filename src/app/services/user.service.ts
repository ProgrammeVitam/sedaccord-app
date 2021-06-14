import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {catchError, tap} from 'rxjs/operators';
import {User} from '../dtos/user';
import {ServiceUtil} from './service-util';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private usersUrl = 'api/users';

  constructor(private http: HttpClient) {
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.usersUrl)
      .pipe(
        tap(_ => ServiceUtil.log('fetched users')),
        catchError(ServiceUtil.handleError<User[]>('getUsers', []))
      );
  }

  findUsersByName(name: string): Observable<User[]> {
    const url = `${this.usersUrl}/?name=${name}`;
    return this.http.get<User[]>(url)
      .pipe(
        tap(value => value.length ?
          ServiceUtil.log(`found users whose name matching "${name}"`) : ServiceUtil.log(`no users whose name matching "${name}"`)),
        catchError(ServiceUtil.handleError<User[]>(`findUserByName name=${name}`, []))
      );
  }
}
