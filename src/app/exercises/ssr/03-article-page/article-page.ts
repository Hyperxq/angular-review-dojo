import { Component } from '@angular/core';
import { Comments, Comment } from './comments';
import { ReactionBar } from './reaction-bar';

@Component({
  selector: 'app-article-page',
  imports: [ReactionBar, Comments],
  template: `
    <article>
      <h2>Why we moved the cart to signals</h2>
      <p>A short story about derived state, and the bug that made us do it.</p>

      @defer (hydrate on interaction) {
        <app-reaction-bar [initial]="12" />
      }

      <h3>Comments</h3>
      <app-comments [comments]="comments" />
    </article>
  `,
})
export class ArticlePage {
  protected readonly comments: Comment[] = [
    { id: 1, author: 'Ana', text: 'Great write-up', postedAt: Date.parse('2026-01-01T09:00:00Z') },
    {
      id: 2,
      author: 'Marcus',
      text: 'We did the same',
      postedAt: Date.parse('2026-01-01T09:30:00Z'),
    },
  ];
}
