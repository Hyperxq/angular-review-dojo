function inline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
}

/** Small markdown subset for release notes: headings, paragraphs, bold and links. */
export function renderMarkdown(source: string): string {
  return source
    .split(/\n{2,}/)
    .filter((block) => block.trim())
    .map((block) =>
      block.startsWith('# ') ? `<h2>${inline(block.slice(2))}</h2>` : `<p>${inline(block)}</p>`,
    )
    .join('');
}
