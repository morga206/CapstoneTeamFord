import { TestBed, inject } from '@angular/core/testing';

import { RestService } from './rest.service';
import { HttpClientModule } from '@angular/common/http';

describe('RestService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RestService],
      imports: [HttpClientModule]
    });
  });

  it('should be created', inject([RestService], (service: RestService) => {
    expect(service).toBeTruthy();
  }));
});
