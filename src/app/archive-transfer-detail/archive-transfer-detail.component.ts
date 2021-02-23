import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {ArchiveTransfer} from '../dtos/archive-transfer';
import {ArchiveTransferService} from '../services/archive-transfer.service';

@Component({
  selector: 'app-archive-transfer-detail',
  templateUrl: './archive-transfer-detail.component.html',
  styleUrls: ['./archive-transfer-detail.component.scss']
})
export class ArchiveTransferDetailComponent implements OnInit {
  archiveTransfer: ArchiveTransfer;

  constructor(
    private _route: ActivatedRoute,
    private _archiveTransferService: ArchiveTransferService
  ) {
  }

  ngOnInit(): void {
    const id: number = +this._route.snapshot.paramMap.get('id');
    this._getArchiveTransfer(id);
  }

  private _getArchiveTransfer(id: number): void {
    this._archiveTransferService.getArchiveTransfer(id)
      .subscribe(archiveTransfer => this.archiveTransfer = archiveTransfer);
  }
}
