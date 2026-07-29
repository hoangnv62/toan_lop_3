import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import TeacherLayout from '../../layouts/TeacherLayout';
import {useClasses, useClassMutations} from '../../hooks/useClass';
import {toast} from 'react-toastify';
import {FiPlus, FiTrash2, FiArrowRight, FiUsers, FiAlertTriangle} from 'react-icons/fi';
import Pagination from '../../components/Pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const STATUS = {
    good: {
        badge: 'success',
        label: 'Tốt',
        accent: 'from-emerald-400 to-emerald-500',
        avatar: 'from-emerald-500 to-emerald-600'
    },
    warning: {
        badge: 'warning',
        label: 'Trung bình',
        accent: 'from-amber-400 to-amber-500',
        avatar: 'from-amber-500 to-amber-600'
    },
    bad: {
        badge: 'danger',
        label: 'Cần cải thiện',
        accent: 'from-red-400 to-red-500',
        avatar: 'from-red-500 to-red-600'
    },
};
const DEFAULT_COLORS = {accent: 'from-indigo-500 to-violet-500', avatar: 'from-indigo-500 to-violet-600'};

// Mỗi giáo viên chỉ được quản lý tối đa 5 lớp
const MAX_CLASSES = 5;

export default function ManageClass() {
    const [page, setPage] = useState(1);
    const [newName, setNewName] = useState('');
    const [refreshKey, setRefreshKey] = useState(0);
    const [pendingDelete, setPendingDelete] = useState(null);
    const navigate = useNavigate();
    const {items: classes, total, pages, loading: listLoading} = useClasses(page, 12, refreshKey);
    const {create, remove, loading: mutationLoading} = useClassMutations();

    const refresh = () => setRefreshKey(k => k + 1);

    const limitReached = total >= MAX_CLASSES;

    async function handleCreate() {
        if (listLoading) return;
        if (limitReached) return toast.error(`Bạn chỉ có thể tạo tối đa ${MAX_CLASSES} lớp học`);
        const name = newName.trim();
        if (!name) return toast.error('Vui lòng nhập tên lớp');
        await create(name, () => {
            setNewName('');
            setPage(1);
            refresh();
        });
    }

    async function handleDelete() {
        if (!pendingDelete) return;
        await remove(pendingDelete.classId, () => {
            const newPage = classes.length === 1 && page > 1 ? page - 1 : page;
            setPage(newPage);
            refresh();
        });
        setPendingDelete(null);
    }

    return (
        <TeacherLayout>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Quản lý lớp học</h1>
                    <p className="text-sm text-slate-500 mt-0.5">{total}/{MAX_CLASSES} lớp</p>
                </div>
            </div>

            {/* Create */}
            <Card className="p-5 gap-0 mb-6">
                <p className="text-sm font-semibold text-slate-700 mb-3">Thêm lớp học mới</p>
                <div className="flex gap-3">
                    <Input
                        className="flex-1"
                        placeholder={limitReached ? `Đã đạt giới hạn ${MAX_CLASSES} lớp` : 'Nhập tên lớp học...'}
                        value={newName}
                        disabled={limitReached}
                        onChange={e => setNewName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleCreate()}
                    />
                    <Button variant="gradient" className="whitespace-nowrap" onClick={handleCreate} disabled={mutationLoading || listLoading || limitReached}>
                        <FiPlus size={16}/>
                        {mutationLoading ? 'Đang tạo...' : 'Thêm lớp'}
                    </Button>
                </div>
                {limitReached && (
                    <Alert variant="warning" className="mt-3">
                        <FiAlertTriangle/>
                        <AlertTitle>Đã đạt giới hạn {MAX_CLASSES} lớp học</AlertTitle>
                        <AlertDescription>Hãy xóa một lớp cũ nếu bạn muốn tạo lớp mới.</AlertDescription>
                    </Alert>
                )}
            </Card>

            {/* Grid */}
            {listLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {Array.from({length: 6}).map((_, i) => (
                        <Card key={i} className="p-5 gap-5 hover:translate-y-0">
                            <div className="flex items-start gap-3">
                                <Skeleton className="size-11 rounded-xl"/>
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-2/3"/>
                                    <Skeleton className="h-4 w-16 rounded-full"/>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {Array.from({length: 3}).map((_, j) => <Skeleton key={j} className="h-16 rounded-xl"/>)}
                            </div>
                            <Skeleton className="h-9 w-full rounded-md"/>
                        </Card>
                    ))}
                </div>
            ) : classes.length === 0 ? (
                <div className="text-center py-20">
                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <FiUsers size={22} className="text-indigo-400"/>
                    </div>
                    <p className="text-slate-500 font-semibold">Chưa có lớp học nào</p>
                    <p className="text-sm text-slate-400 mt-1">Tạo lớp đầu tiên để bắt đầu</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {classes.map(c => {
                        const s = STATUS[c.status] || DEFAULT_COLORS;
                        const initial = c.className.trim().charAt(0).toUpperCase();
                        return (
                            <Card key={c.classId} className="p-0 gap-0 overflow-hidden hover:-translate-y-1">

                                {/* Color strip */}
                                <div className={`h-1 bg-gradient-to-r ${s.accent}`}/>

                                <CardContent className="p-5 flex flex-col flex-1">
                                    {/* Top row */}
                                    <div className="flex items-start gap-3 mb-5">
                                        <Avatar className={`size-11 rounded-xl bg-gradient-to-br ${s.avatar} shadow-xs`}>
                                            <AvatarFallback
                                                className="rounded-xl bg-transparent text-white font-extrabold text-lg">
                                                {initial}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0 pt-0.5">
                                            <h3 className="font-bold text-slate-900 text-base leading-tight truncate">{c.className}</h3>
                                            {s.label && (
                                                <Badge variant={s.badge} className="mt-1.5">{s.label}</Badge>
                                            )}
                                        </div>
                                        <Button
                                            variant="ghost" size="icon-sm"
                                            title="Xóa lớp"
                                            className="shrink-0 mt-0.5 text-slate-300 hover:text-red-500 hover:bg-red-50"
                                            onClick={() => setPendingDelete(c)}>
                                            <FiTrash2 size={14}/>
                                        </Button>
                                    </div>

                                    {/* Stats */}
                                    <div className="grid grid-cols-3 gap-2 mb-5">
                                        {[
                                            {label: 'Học sinh', value: c.totalStudents},
                                            {label: 'Điểm TB', value: c.avgScore ?? '--'},
                                            {label: 'Tỷ lệ đạt', value: c.passRate != null ? `${c.passRate}%` : '--'},
                                        ].map(({label, value}) => (
                                            <div key={label} className="bg-slate-50 rounded-xl p-3 text-center">
                                                <p className="text-base font-extrabold text-slate-800 leading-none">{value}</p>
                                                <p className="text-xs text-slate-400 mt-1.5">{label}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* CTA */}
                                    <Button variant="gradient" className="w-full py-2 text-sm mt-auto" onClick={() => navigate(`/class-detail/${c.classId}`)}>
                                        Xem chi tiết <FiArrowRight size={13}/>
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            <Pagination page={page} pages={pages} onChange={p => setPage(p)}/>

            {/* Xác nhận xóa lớp */}
            <AlertDialog open={!!pendingDelete} onOpenChange={open => !open && setPendingDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xóa lớp &quot;{pendingDelete?.className}&quot;?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Toàn bộ học sinh trong lớp cũng sẽ bị xóa. Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={mutationLoading}>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            disabled={mutationLoading}
                            onClick={e => { e.preventDefault(); handleDelete(); }}>
                            {mutationLoading ? 'Đang xóa...' : 'Xóa lớp'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </TeacherLayout>
    );
}
