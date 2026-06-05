import { validate } from './validate-handler.js';
import { lessonSchema } from './schema/lesson.schema.js';

export const validateLesson = validate({ body: lessonSchema });
