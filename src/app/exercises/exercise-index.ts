import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EXERCISES, TOPICS, TOPIC_PART, Topic } from './exercise-registry';

const PARTS = [
  { part: 1, label: 'Part 1: framework mechanics' },
  { part: 2, label: 'Part 2: staff level' },
].map(({ part, label }) => ({
  part,
  label,
  groups: (Object.keys(TOPICS) as Topic[])
    .filter((topic) => TOPIC_PART[topic] === part)
    .map((topic) => ({
      topic,
      label: TOPICS[topic],
      exercises: EXERCISES.filter((e) => e.topic === topic).sort((a, b) => a.level - b.level),
    }))
    .filter((g) => g.exercises.length > 0),
}));

@Component({
  selector: 'app-exercise-index',
  imports: [RouterLink],
  template: `
    @for (part of parts; track part.part) {
      <section [attr.data-part]="part.part">
        <h2>{{ part.label }}</h2>
        @for (group of part.groups; track group.topic) {
          <section>
            <h3>{{ group.label }}</h3>
            <ul>
              @for (exercise of group.exercises; track exercise.slug) {
                <li>
                  <span class="level">L{{ exercise.level }}</span>
                  <a [routerLink]="['/', exercise.topic, exercise.slug]">{{ exercise.title }}</a>
                </li>
              }
            </ul>
          </section>
        }
      </section>
    }
  `,
})
export class ExerciseIndex {
  protected readonly parts = PARTS;
}
