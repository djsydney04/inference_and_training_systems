/** Current section is the last visible heading above the reading line. */
export function currentLessonIndex(tops: number[], readingLine = 150) {
  let index = -1;
  tops.forEach((top, i) => {
    if (Number.isFinite(top) && top <= readingLine) index = i;
  });
  return index;
}
