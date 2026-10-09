import { Component, input } from '@angular/core';

export interface Comment {
  id: number;
  author: string;
  text: string;
  postedAt: number;
}

@Component({
  selector: 'app-comments',
  host: { ngSkipHydration: 'true' },
  template: `
    <ul class="comments">
      @for (comment of comments(); track comment.id) {
        <li>
          <strong>{{ comment.author }}</strong
          >: {{ comment.text }}
          <small>{{ minutesAgo(comment) }} min ago</small>
        </li>
      }
    </ul>
  `,
})
export class Comments {
  readonly comments = input.required<Comment[]>();

  protected minutesAgo(comment: Comment) {
    return Math.round((Date.now() - comment.postedAt) / 60_000);
  }
}
