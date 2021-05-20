import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ArchiveTransferDetailComponent} from './archive-transfer-detail/archive-transfer-detail.component';
import {ArchiveTransfersComponent} from './archive-transfers/archive-transfers.component';

const routes: Routes = [
  { path: '', redirectTo: '/archiveTransfers', pathMatch: 'full' },
  { path: 'detail/:id', component: ArchiveTransferDetailComponent },
  { path: 'archiveTransfers', component: ArchiveTransfersComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
