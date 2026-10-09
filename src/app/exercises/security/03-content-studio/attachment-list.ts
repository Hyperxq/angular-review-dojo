import { Component, input } from '@angular/core';

@Component({
  selector: 'app-attachment-list',
  template: `
    <ul>
      @for (file of files(); track file) {
        <li>
          <a [href]="downloadUrl(file)">{{ file }}</a>
        </li>
      }
    </ul>
  `,
})
export class AttachmentList {
  readonly files = input.required<string[]>();

  protected downloadUrl(file: string) {
    return `/api/files/${encodeURIComponent(file)}/download`;
  }
}
