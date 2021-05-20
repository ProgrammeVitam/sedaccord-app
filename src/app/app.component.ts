import {Component} from '@angular/core';
import {AuthService} from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'sedaccord-app';

  constructor(private _authService: AuthService) {
    this._authService.login('Patrick Dupont').subscribe();
  }
}
