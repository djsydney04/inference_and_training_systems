export const chapterMarkup = (id: string, title: string, intro: string, body: string) =>
  `<section class="chapter" id="${id}" data-chapter="${title}"><div class="chapter-number"></div><div class="chapter-title"><p class="chapter-kicker"></p><h2>${title}</h2><p class="chapter-summary">${intro}</p></div>${body}</section>`;
export const sourceLink = (url: string, title: string) =>
  `<a class="lesson-source" href="${url}" target="_blank" rel="noreferrer">${title}</a>`;
export const workedCheck = (question: string, answer: string) =>
  `<details class="knowledge-check"><summary>${question}</summary><p>${answer}</p></details>`;
export const escapeCode = (code: string) => code.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
