import * as svc from '../services/auth.service.js';
import { success, successMsg } from '../utils/response.js';

export const registerTeacher = async (req, res) => {
  const { username, password, fullName } = req.body;
  const { token, user } = await svc.register(username.trim(), password, fullName.trim(), 'teacher');
  res.status(201).json({ success: true, token, user: { userId: user.id, role: 'teacher', name: user.full_name } });
};

export const registerStudent = async (req, res) => {
  const { username, password, fullName, dob = null } = req.body;
  const { token, user } = await svc.register(username.trim(), password, fullName.trim(), 'student', dob);
  res.status(201).json({ success: true, token, user: { userId: user.id, role: 'student', name: user.full_name } });
};

export const loginTeacher = async (req, res) => {
  const { username, password } = req.body;
  const { token, user } = await svc.login(username.trim(), password, 'teacher');
  res.json({ success: true, token, user: { userId: user.id, role: 'teacher', name: user.full_name } });
};

export const loginStudent = async (req, res) => {
  const { username, password } = req.body;
  const { token, user } = await svc.login(username.trim(), password, 'student');
  res.json({ success: true, token, user: { userId: user.id, role: 'student', name: user.full_name } });
};

export const logout = (req, res) => successMsg(res, 'Logged out');

export const me = (req, res) => {
  success(res, { loggedIn: true, ...req.user });
};

export const getProfile = async (req, res) => {
  const data = await svc.getProfile(req.user.id);
  success(res, data);
};

export const updateProfile = async (req, res) => {
  const { fullName, dob = null, email = null, phone = null } = req.body;
  await svc.updateProfile(req.user.id, fullName.trim(), dob || null, email?.trim() || null, phone?.trim() || null);
  successMsg(res, 'Đã cập nhật');
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await svc.changePassword(req.user.id, currentPassword, newPassword);
  successMsg(res, 'Đổi mật khẩu thành công');
};
