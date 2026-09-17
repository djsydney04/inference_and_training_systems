import { lessonVisuals } from "./lesson-visual-data.ts";
import { hardwareVisuals } from "./lesson-visual-hardware.ts";
import { servingVisuals } from "./lesson-visual-serving.ts";
import { portableVisuals } from "./lesson-visual-portable.ts";
export const allLessonVisuals = [...lessonVisuals, ...hardwareVisuals, ...servingVisuals, ...portableVisuals];
