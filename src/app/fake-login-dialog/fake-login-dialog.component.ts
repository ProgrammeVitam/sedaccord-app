import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {User, UserRole, UserUtil} from '../dtos/user';
import {UserService} from '../services/user.service';

interface LoginDialogData {
  currentUserName: string;
}

@Component({
  selector: 'app-fake-login-dialog',
  templateUrl: './fake-login-dialog.component.html',
  styleUrls: ['./fake-login-dialog.component.scss']
})
export class FakeLoginDialogComponent implements OnInit {
  availableUsers!: User[];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: LoginDialogData,
    private _dialogRef: MatDialogRef<FakeLoginDialogComponent>,
    private _userService: UserService
  ) {
  }

  getDisplayRole = (userRole: UserRole) => UserUtil.getDisplayRole(userRole);

  ngOnInit(): void {
    this._getAvailableUsers();
  }

  onNoClick(): void {
    this._dialogRef.close();
  }

  private _getAvailableUsers(): void {
    this._userService.getUsers()
      .subscribe(users => this.availableUsers = users);
  }
}
