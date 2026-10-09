import { TestBed } from '@angular/core/testing';
import { AttachmentList } from './attachment-list';
import { MarkdownPreview } from './markdown-preview';
import { ShareBanner } from './share-banner';

function handlers(root: Element) {
  return [...root.querySelectorAll('*')].flatMap((el) =>
    el.getAttributeNames().filter((name) => name.startsWith('on')),
  );
}

describe('L3 - content studio', () => {
  describe('markdown preview', () => {
    async function preview(source: string) {
      const fixture = TestBed.createComponent(MarkdownPreview);
      fixture.componentRef.setInput('source', source);
      await fixture.whenStable();
      return fixture.nativeElement as HTMLElement;
    }

    it('renders headings, bold text and web links', async () => {
      const root = await preview(
        '# Title\n\nNow **bold** and [docs](https://studio.example/docs).',
      );

      expect(root.querySelector('h2')?.textContent).toBe('Title');
      expect(root.querySelector('strong')?.textContent).toBe('bold');
      expect(root.querySelector('a')?.getAttribute('href')).toBe('https://studio.example/docs');
    });

    it('shows raw HTML in the source as text, not as elements', async () => {
      const root = await preview('Before <img src="x" onerror="alert(1)"> after');

      expect(root.querySelector('img')).toBeNull();
      expect(handlers(root)).toEqual([]);
      expect(root.textContent).toContain('<img');
    });

    it('does not turn script URLs into links', async () => {
      const root = await preview('[click me](javascript:alert(1))');

      const hrefs = [...root.querySelectorAll('a')].map((a) => a.getAttribute('href') ?? '');
      expect(hrefs.filter((h) => /^\s*javascript:/i.test(h))).toEqual([]);
    });

    it('cannot be broken out of an attribute by a quote in the address', async () => {
      const root = await preview('[x](" onmouseover="alert(1))');

      expect(handlers(root)).toEqual([]);
    });
  });

  describe('attachment list', () => {
    async function list(files: string[]) {
      const fixture = TestBed.createComponent(AttachmentList);
      fixture.componentRef.setInput('files', files);
      await fixture.whenStable();
      return [...(fixture.nativeElement as HTMLElement).querySelectorAll('a')].map((a) =>
        a.getAttribute('href'),
      );
    }

    it('links a plain file name to its download', async () => {
      expect(await list(['report.pdf'])).toEqual(['/api/files/report.pdf/download']);
    });

    it('encodes the file name as a single path segment', async () => {
      const hrefs = await list(['../admin/users.csv', 'budget 2026.xlsx', 'a?b#c.txt']);

      expect(hrefs).toEqual([
        `/api/files/${encodeURIComponent('../admin/users.csv')}/download`,
        '/api/files/budget%202026.xlsx/download',
        `/api/files/${encodeURIComponent('a?b#c.txt')}/download`,
      ]);
    });
  });

  describe('share banner', () => {
    async function banner(sharedBy: string) {
      const fixture = TestBed.createComponent(ShareBanner);
      fixture.componentRef.setInput('sharedBy', sharedBy);
      fixture.componentRef.setInput('fileName', 'Q3 roadmap.pdf');
      await fixture.whenStable();
      return fixture.nativeElement as HTMLElement;
    }

    it('says who shared what', async () => {
      const root = await banner('Dana');

      expect(root.querySelector('strong')?.textContent).toBe('Dana');
      expect(root.querySelector('em')?.textContent).toBe('Q3 roadmap.pdf');
    });

    it('treats a display name as text', async () => {
      const root = await banner('Dana <img src="x" onerror="alert(1)">');

      expect(root.querySelector('img')).toBeNull();
      expect(handlers(root)).toEqual([]);
      expect(root.querySelector('strong')?.textContent).toContain('<img');
    });
  });
});
