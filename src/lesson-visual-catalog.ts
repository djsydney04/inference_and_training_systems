import { lessonVisuals } from "./lesson-visual-data.ts";
import { hardwareVisuals } from "./lesson-visual-hardware.ts";
import { servingVisuals } from "./lesson-visual-serving.ts";
export const allLessonVisuals = [...lessonVisuals, ...hardwareVisuals, ...servingVisuals];
