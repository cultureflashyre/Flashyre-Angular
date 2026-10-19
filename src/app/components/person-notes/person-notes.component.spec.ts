import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PersonNotesComponent } from './person-notes.component';
import { environment } from '../../../environments/environment';

const note = (id: number, author: string, body = 'hello') => ({
  id, kind: 'intake', candidate: null, intake: 3, author, author_name: 'Author ' + author, body, created_at: '2026-10-19T10:00:00Z',
});

describe('PersonNotesComponent', () => {
  let fixture: ComponentFixture<PersonNotesComponent>;
  let component: PersonNotesComponent;
  let http: HttpTestingController;
  const list = `${environment.apiUrl}api/candidate-notes/?intake_id=3`;

  function create(userId = 'REC1', superUser = false) {
    localStorage.setItem('user_id', userId);
    localStorage.setItem('isSuperUser', superUser ? 'true' : 'false');
    fixture = TestBed.createComponent(PersonNotesComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('kind', 'intake');
    fixture.componentRef.setInput('personId', 3);
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [PersonNotesComponent, HttpClientTestingModule] });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.removeItem('isSuperUser');
  });

  it('loads and shows the notes of the person', () => {
    create();
    http.expectOne(list).flush([note(1, 'REC1', 'first'), note(2, 'REC2', 'second')]);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent!;
    expect(text).toContain('first');
    expect(text).toContain('second');
  });

  it('adds a note at the top and clears the box; ignores blank notes', () => {
    create();
    http.expectOne(list).flush([note(1, 'REC1')]);
    component.draft = '   ';
    component.add();
    http.expectNone(`${environment.apiUrl}api/candidate-notes/`);

    component.draft = ' called, will revert ';
    component.add();
    const req = http.expectOne(`${environment.apiUrl}api/candidate-notes/`);
    expect(req.request.body).toEqual({ intake_id: 3, body: 'called, will revert' });
    req.flush(note(9, 'REC1', 'called, will revert'));
    expect(component.notes[0].id).toBe(9);
    expect(component.draft).toBe('');
  });

  it('lets only the author or a super admin delete a note', () => {
    create('REC1');
    http.expectOne(list).flush([note(1, 'REC1'), note(2, 'REC2')]);
    expect(component.canDelete(component.notes[0])).toBeTrue();
    expect(component.canDelete(component.notes[1])).toBeFalse();
  });

  it('lets a super admin delete any note and removes it from the list', () => {
    create('ADM1', true);
    http.expectOne(list).flush([note(2, 'REC2')]);
    expect(component.canDelete(component.notes[0])).toBeTrue();
    component.remove(component.notes[0]);
    const req = http.expectOne(`${environment.apiUrl}api/candidate-notes/2/`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
    expect(component.notes.length).toBe(0);
  });

  it('shows the server message when a note cannot be saved', () => {
    create();
    http.expectOne(list).flush([]);
    component.draft = 'x';
    component.add();
    http.expectOne(`${environment.apiUrl}api/candidate-notes/`)
      .flush({ body: ['A note can have at most 5000 characters.'] }, { status: 400, statusText: 'Bad Request' });
    expect(component.error).toBe('A note can have at most 5000 characters.');
    expect(component.saving).toBeFalse();
  });
});
