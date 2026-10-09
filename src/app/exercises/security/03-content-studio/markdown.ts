const SAFE_LINK = /^(https?:|mailto:)/i;

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };

function escapeHtml(text: string): string {
  return text.replace(/[&<>"]/g, (char) => ESCAPES[char]);
}

function inline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[(.+?)\]\((.+?)\)/g, (_, label: string, url: string) =>
      SAFE_LINK.test(url) ? `<a href="${url}">${label}</a>` : label,
    );
}

/** Small markdown subset for release notes: headings, paragraphs, bold and links. */
export function renderMarkdown(source: string): string {
  return escapeHtml(source)
    .split(/\n{2,}/)
    .filter((block) => block.trim())
    .map((block) =>
      block.startsWith('# ') ? `<h2>${inline(block.slice(2))}</h2>` : `<p>${inline(block)}</p>`,
    )
    .join('');
}
