import { Component, signal } from '@angular/core';
import { AttachmentList } from './attachment-list';
import { MarkdownPreview } from './markdown-preview';
import { ShareBanner } from './share-banner';

@Component({
  selector: 'app-studio-demo',
  imports: [MarkdownPreview, AttachmentList, ShareBanner],
  template: `
    <app-share-banner [sharedBy]="sharedBy" fileName="Q3 roadmap.pdf" />
    <h2>Release notes</h2>
    <textarea
      rows="6"
      cols="60"
      [value]="notes()"
      (input)="notes.set($any($event.target).value)"
    ></textarea>
    <app-markdown-preview [source]="notes()" />
    <h2>Attachments</h2>
    <app-attachment-list [files]="files" />
  `,
})
export class StudioDemo {
  protected readonly sharedBy = 'Dana <img src="x" onerror="alert(\'banner\')">';
  protected readonly files = ['roadmap.pdf', '../admin/users.csv', 'budget 2026.xlsx'];
  protected readonly notes = signal(
    '# Release 4.2\n\nNow with **dark mode**. See the [changelog](https://studio.example/changelog).\n\n<img src="x" onerror="alert(\'notes\')">',
  );
}
