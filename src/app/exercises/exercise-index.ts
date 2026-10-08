import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EXERCISES, TOPICS, Topic } from './exercise-registry';

const GROUPS = (Object.keys(TOPICS) as Topic[])
  .map((topic) => ({
    topic,
    label: TOPICS[topic],
    exercises: EXERCISES.filter((e) => e.topic === topic).sort((a, b) => a.level - b.level),
  }))
  .filter((g) => g.exercises.length > 0);

@Component({
  selector: 'app-exercise-index',
  imports: [RouterLink],
  template: `
    @for (group of groups; track group.topic) {
      <section>
        <h2>{{ group.label }}</h2>
        <ul>
          @for (exercise of group.exercises; track exercise.slug) {
            <li>
              <span class="level">L{{ exercise.level }}</span>
              <a [routerLink]="['/', exercise.topic, exercise.slug]">{{ exercise.title }}</a>
            </li>
          }
        </ul>
      </section>
    } @empty {
      <p>No exercises yet.</p>
    }
  `,
})
export class ExerciseIndex {
  protected readonly groups = GROUPS;
}
