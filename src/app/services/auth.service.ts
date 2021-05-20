import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {User} from '../dtos/user';
import {UserService} from './user.service';
import {map, tap} from 'rxjs/operators';

export const ANONYMOUS_USER = {
  id: 0,
  name: '',
  role: 'transfer'
} as User;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly _currentUser$: BehaviorSubject<User>;

  constructor(private _userService: UserService) {
    this._currentUser$ = new BehaviorSubject<User>(ANONYMOUS_USER);
  }

  login(name: string): Observable<User> {
    return this._userService.findUsersByName(name).pipe(
      map(value => {
        return value.length ? value[0] : ANONYMOUS_USER;
      }),
      tap(value => this._currentUser$.next(value))
    );
  }

  getCurrentUserValue(): User {
    return this._currentUser$.value;
  }
}
