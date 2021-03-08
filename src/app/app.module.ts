import {NgModule} from '@angular/core';
import {AppRoutingModule} from './app-routing.module';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HttpClientInMemoryWebApiModule} from 'angular-in-memory-web-api';
import {HttpClientModule} from '@angular/common/http';
import {InMemoryDataService} from './services/in-memory-data.service';
import {MaterialModule} from './material-module';
import {AppComponent} from './app.component';
import {ArchiveTransferAddComponent} from './archive-transfer-add/archive-transfer-add.component';
import {ArchiveTransferContextComponent} from './archive-transfer-context/archive-transfer-context.component';
import {ArchiveTransferDetailComponent} from './archive-transfer-detail/archive-transfer-detail.component';
import {ArchiveTransferFilesComponent} from './archive-transfer-files/archive-transfer-files.component';
import {ArchiveTransfersComponent} from './archive-transfers/archive-transfers.component';
import {FileDetailComponent} from './file-detail/file-detail.component';
import {FileDropInputControlComponent} from './file-drop-input-control/file-drop-input-control.component';
import {FileTableComponent} from './file-table/file-table.component';
import {FileTreeComponent} from './file-tree/file-tree.component';
import {TreeAutocompleteControlComponent} from './tree-autocomplete-control/tree-autocomplete-control.component';
import {MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatDateFormats} from '@angular/material/core';
import {ConfirmDialogComponent} from './confirm-dialog/confirm-dialog.component';

export const MY_FORMATS: MatDateFormats = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'DD/MM/YYYY',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@NgModule({
  imports: [
    AppRoutingModule,
    BrowserAnimationsModule,
    BrowserModule,
    FormsModule,
    HttpClientInMemoryWebApiModule.forRoot(
      InMemoryDataService, {dataEncapsulation: false}
    ),
    HttpClientModule,
    MaterialModule,
    ReactiveFormsModule
  ],
  declarations: [
    AppComponent,
    ArchiveTransferAddComponent,
    ArchiveTransferContextComponent,
    ArchiveTransferDetailComponent,
    ArchiveTransferFilesComponent,
    ArchiveTransfersComponent,
    ConfirmDialogComponent,
    FileDetailComponent,
    FileDropInputControlComponent,
    FileTableComponent,
    FileTreeComponent,
    TreeAutocompleteControlComponent
  ],
  providers: [
    {provide: MAT_DATE_LOCALE, useValue: 'fr-FR'},
    {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS}
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
