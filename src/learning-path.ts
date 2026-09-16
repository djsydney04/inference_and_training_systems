import { adjacentChapters, chapters, learningPaths } from "./curriculum.ts";
import type { Chapter } from "./curriculum.ts";

export type LearningPath = (typeof learningPaths)[number];

export type ReadingSequence = {
  path: LearningPath;
  inPath: boolean;
  /** One-based position in the selected path; zero means outside that path. */
  position: number;
  total: number;
  previous: Chapter | undefined;
  next: Chapter | undefined;
};

/** A stale or missing saved selection always resolves to the full curriculum. */
export function learningPathForId(pathId?: string | null): LearningPath {
  return learningPaths.find((path) => path.id === pathId) ?? learningPaths[0];
}

/**
 * Follow the selected learning path through its prerequisites and target chapters.
 * A reference page or a chapter opened outside the path retains canonical book
 * navigation, and is explicitly marked as outside the selected path.
 */
export function readingSequence(
  chapterId: string,
  pathId?: string | null,
): ReadingSequence {
  const path = learningPathForId(pathId);
  const index = path.route.indexOf(chapterId);
  if (index < 0) {
    const { previous, next } = adjacentChapters(chapterId);
    return {
      path,
      inPath: false,
      position: 0,
      total: path.route.length,
      previous,
      next,
    };
  }
  const chapterAt = (offset: number) =>
    chapters.find((chapter) => chapter.id === path.route[index + offset]);
  return {
    path,
    inPath: true,
    position: index + 1,
    total: path.route.length,
    previous: chapterAt(-1),
    next: chapterAt(1),
  };
}

export const adjacentInPath = readingSequence;
