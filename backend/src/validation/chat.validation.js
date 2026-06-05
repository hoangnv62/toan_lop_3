import { validate } from './validate-handler.js';
import { chatSchema } from './schema/chat.schema.js';

export const validateChat = validate({ body: chatSchema });
