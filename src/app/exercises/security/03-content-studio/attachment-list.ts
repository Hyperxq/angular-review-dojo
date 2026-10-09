import { Component, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

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
  private readonly sanitizer = inject(DomSanitizer);

  readonly files = input.required<string[]>();

  protected downloadUrl(file: string) {
    return this.sanitizer.bypassSecurityTrustUrl(`/api/files/${file}/download`);
  }
}
