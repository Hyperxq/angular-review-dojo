import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ExerciseIndex } from './exercise-index';
import { EXERCISES, TOPIC_PART } from './exercise-registry';

describe('ExerciseIndex', () => {
  it('links to every registered exercise', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(ExerciseIndex);
    await fixture.whenStable();

    const hrefs = [...(fixture.nativeElement as HTMLElement).querySelectorAll('a')].map((a) =>
      a.getAttribute('href'),
    );
    expect(hrefs).toEqual(expect.arrayContaining(EXERCISES.map((e) => `/${e.topic}/${e.slug}`)));
    expect(hrefs).toHaveLength(EXERCISES.length);
  });

  it('lists every exercise under the part its topic belongs to', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(ExerciseIndex);
    await fixture.whenStable();

    for (const part of [1, 2]) {
      const section = (fixture.nativeElement as HTMLElement).querySelector(
        `[data-part="${part}"]`,
      )!;
      const expected = EXERCISES.filter((e) => TOPIC_PART[e.topic] === part).length;
      expect(section.querySelectorAll('a')).toHaveLength(expected);
    }
  });
});
