import bcrypt from 'bcryptjs';
import * as userRepo from '../repositories/user.repository.js';
import {generateToken} from './jwt.service.js';
import {NotFoundError, ConflictError, UnauthorizedError} from '../utils/error.utils.js';
import {Authority} from "../constants/authority.js";
import { formatDate } from '../utils/date.utils.js';

const verifyPassword = async (stored, provided) => {
    if (!stored) return false;
    if (stored.startsWith('$2')) return bcrypt.compare(provided, stored);
    return stored === provided;
};

export const register = async (username, password, fullName, role, dob = null) => {
    const existing = await userRepo.findByUsername(username);
    if (existing) throw new ConflictError('Tên đăng nhập đã tồn tại');
    const hashed = await bcrypt.hash(password, 10);
    const user = await userRepo.create(username, hashed, fullName, role, dob);
    const token = generateToken(user.id, role, fullName);
    return {token, user};
};

export const login = async (username, password, role) => {
    const user = await userRepo.findByUsernameAndRole(username, role);
    if (!user || !(await verifyPassword(user.password, password))) {
        throw new UnauthorizedError('Sai tài khoản hoặc mật khẩu');
    }
    const token = generateToken(user.id, user.role, user.full_name);
    return {token, user};
};

export const changePassword = async (userId, currentPw, newPw) => {
    const user = await userRepo.findById(userId);
    if (!user || !(await verifyPassword(user.password, currentPw))) {
        throw new UnauthorizedError('Mật khẩu hiện tại không đúng');
    }
    await userRepo.updatePassword(userId, await bcrypt.hash(newPw, 10));
};

export const getProfile = async (userId) => {
    const profile = await userRepo.getProfile(userId);
    if (!profile) throw new NotFoundError('Người dùng không tồn tại');
    return { ...profile, dob: formatDate(profile.dob) };
};

export const updateProfile = async (userId, fullName, dob, email, phone) => {
    await userRepo.updateProfile(userId, fullName, dob || null, email || null, phone || null);
};

export const isTeacher = (user) => {
    return user.role === Authority.TEACHER;
}

export const isStudent = (user) => {
    return user.role === Authority.TEACHER;
}
