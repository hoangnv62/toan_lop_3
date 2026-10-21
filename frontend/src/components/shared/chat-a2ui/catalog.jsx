/* eslint-disable react-refresh/only-export-components --
   File gom component thành catalog (như src/components/ui/), không cần Fast Refresh riêng. */
import { useId } from 'react';
import { createComponentImplementation } from '@a2ui/react/v0_9';
import { Catalog } from '@a2ui/web_core/v0_9';
import {
  ButtonApi, CardApi, ChoicePickerApi, ColumnApi, DateTimeInputApi, TextApi, TextFieldApi,
} from '@a2ui/web_core/v0_9/basic_catalog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// Catalog A2UI của dự án: dùng NGUYÊN schema của basic catalog (tên component + thuộc tính
// đúng chuẩn A2UI v0.9) nhưng hiển thị bằng shadcn, để form chatbot gửi khớp giao diện của app
// thay vì kiểu dáng mặc định của @a2ui/react. catalogId phải khớp backend
// (src/chat/a2ui/assign-exam-form.js). Chỉ có các component form đang dùng tới.
export const SHADCN_CATALOG_ID = 'https://eduhub.local/a2ui/catalogs/shadcn-basic-v1.json';

const renderChildren = (children, buildChild) =>
  (Array.isArray(children) ? children : []).map((ref, i) => (typeof ref === 'string'
    ? <div key={`${ref}-${i}`}>{buildChild(ref)}</div>
    : <div key={`${ref.id}-${i}`}>{buildChild(ref.id, ref.basePath)}</div>));

const Card = createComponentImplementation(CardApi, ({ props, buildChild }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
    {props.child ? buildChild(props.child) : null}
  </div>
));

const Column = createComponentImplementation(ColumnApi, ({ props, buildChild }) => (
  <div className="flex flex-col gap-3">{renderChildren(props.children, buildChild)}</div>
));

// Text trong nút (body) là <span>; tiêu đề / chú thích là đoạn riêng.
const Text = createComponentImplementation(TextApi, ({ props }) => {
  if (props.variant?.startsWith('h')) {
    return <p className="text-sm font-semibold text-slate-900">{props.text}</p>;
  }
  if (props.variant === 'caption') {
    return <p className="-mt-2 text-xs text-slate-400">{props.text}</p>;
  }
  return <span>{props.text}</span>;
});

const FieldLabel = ({ htmlFor, children }) => (
  <Label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-slate-600">
    {children}
  </Label>
);

const TextField = createComponentImplementation(TextFieldApi, ({ props }) => {
  const id = useId();
  return (
    <div>
      {props.label && <FieldLabel htmlFor={id}>{props.label}</FieldLabel>}
      <Input id={id} type={props.variant === 'number' ? 'number' : 'text'} min={1}
             value={props.value ?? ''} onChange={e => props.setValue(e.target.value)}/>
    </div>
  );
});

const DateTimeInput = createComponentImplementation(DateTimeInputApi, ({ props }) => {
  const id = useId();
  const type = props.enableDate && props.enableTime ? 'datetime-local'
    : props.enableTime ? 'time' : 'date';
  return (
    <div>
      {props.label && <FieldLabel htmlFor={id}>{props.label}</FieldLabel>}
      <Input id={id} type={type} min={props.min} max={props.max}
             value={props.value ?? ''} onChange={e => props.setValue(e.target.value)}/>
    </div>
  );
});

// Chỉ hỗ trợ chọn một (mutuallyExclusive) — đủ cho form giao bài. Radix Select không nhận
// value="" nên chưa chọn thì để undefined.
const ChoicePicker = createComponentImplementation(ChoicePickerApi, ({ props }) => {
  const id = useId();
  const selected = Array.isArray(props.value) ? props.value[0] : undefined;
  return (
    <div>
      {props.label && <FieldLabel htmlFor={id}>{props.label}</FieldLabel>}
      <Select value={selected} onValueChange={v => props.setValue([v])}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder="-- Chọn --"/>
        </SelectTrigger>
        <SelectContent>
          {(props.options ?? []).map(o => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
});

const A2uiButton = createComponentImplementation(ButtonApi, ({ props, buildChild }) => (
  <Button variant={props.variant === 'primary' ? 'gradient' : 'outline'}
          className={cn('w-full', props.variant === 'borderless' && 'border-none')}
          onClick={props.action} disabled={props.isValid === false}>
    {props.child ? buildChild(props.child) : null}
  </Button>
));

export const shadcnCatalog = new Catalog(
  SHADCN_CATALOG_ID,
  'v0.9',
  [Card, Column, Text, TextField, DateTimeInput, ChoicePicker, A2uiButton],
  [],
);
