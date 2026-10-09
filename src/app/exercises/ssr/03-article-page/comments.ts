import { Component, afterNextRender, input, signal } from '@angular/core';

export interface Comment {
  id: number;
  author: string;
  text: string;
  postedAt: number;
}

@Component({
  selector: 'app-comments',
  template: `
    <ul class="comments">
      @for (comment of comments(); track comment.id) {
        <li>
          <strong>{{ comment.author }}</strong
          >: {{ comment.text }}
          @if (now(); as time) {
            <small>{{ minutesAgo(comment, time) }} min ago</small>
          }
        </li>
      }
    </ul>
  `,
})
export class Comments {
  readonly comments = input.required<Comment[]>();

  protected readonly now = signal<number | null>(null);

  constructor() {
    afterNextRender(() => this.now.set(Date.now()));
  }

  protected minutesAgo(comment: Comment, now: number) {
    return Math.round((now - comment.postedAt) / 60_000);
  }
}
