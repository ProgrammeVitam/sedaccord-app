import { TestBed } from '@angular/core/testing';

import { ArchiveTransferService } from './archive-transfer.service';

describe('ArchiveTransferService', () => {
  let service: ArchiveTransferService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ArchiveTransferService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
