import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {User, UserRole} from '../dtos/user';
import {UserService} from '../services/user.service';

interface LoginDialogData {
  currentUserName: string;
}

@Component({
  selector: 'app-fake-login-dialog',
  templateUrl: './fake-login-dialog.component.html',
  styleUrls: ['./fake-login-dialog.component.scss']
})
export class FakeLoginDialogComponent {
  availableUsers!: User[];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: LoginDialogData,
    private _dialogRef: MatDialogRef<FakeLoginDialogComponent>,
    private _userService: UserService
  ) {
    this._getAvailableUsers();
  }

  onNoClick(): void {
    this._dialogRef.close();
  }

  getDisplayRole(role: UserRole): any {
    switch (role) {
      case 'ARCHIVE':
        return 'archiviste';
      case 'TRANSFER':
        return 'agent versant';
      default:
        return '-';
    }
  }

  private _getAvailableUsers(): void {
    this._userService.getUsers().subscribe(users => this.availableUsers = users);
  }
}
