import { validate } from './validate-handler.js';
import { chatSchema, confirmActionParamsSchema, confirmActionBodySchema } from './schema/chat.schema.js';

export const validateChat = validate({ body: chatSchema });

export const validateConfirmAction = validate({
  params: confirmActionParamsSchema,
  body: confirmActionBodySchema,
});
