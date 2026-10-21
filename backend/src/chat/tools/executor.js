import { toolRegistry } from './registry.js';

// context: thông tin của lượt chat hiện tại (vd. turnStartedAt) cho tool cần biết.
export const executeTool = async (name, args, user, context = {}) => {
  const handler = toolRegistry[name];
  if (!handler) {
    return { success: false, data: null, message: `Tool không tồn tại: ${name}`, metadata: {} };
  }

  const start = Date.now();
  try {
    const result = await handler(args, user, context);
    console.log(`[tool] ${name} userId=${user.id} duration=${Date.now() - start}ms success=true`);
    return result;
  } catch (err) {
    console.error(`[tool] ${name} userId=${user.id} duration=${Date.now() - start}ms success=false error=${err.message}`);
    return { success: false, data: null, message: err.message || 'Tool thực thi thất bại', metadata: {} };
  }
};
