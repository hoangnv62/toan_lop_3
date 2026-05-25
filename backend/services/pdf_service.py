import io
import os
import random
from fpdf import FPDF

FONTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'fonts')
FONT_REGULAR = os.path.join(FONTS_DIR, 'NotoSans-Regular.ttf')
FONT_BOLD    = os.path.join(FONTS_DIR, 'NotoSans-Bold.ttf')

LABELS = ['A', 'B', 'C', 'D']


# ── Shuffle ───────────────────────────────────────────────────────────────────

def _shuffle(lst):
    result = lst[:]
    random.shuffle(result)
    return result


def generate_variants(questions: list, count: int) -> list:
    variants = []
    for i in range(count):
        code = str(i + 1).zfill(3)
        shuffled_qs = _shuffle(questions)
        variant_questions = []
        for q in shuffled_qs:
            shuffled_answers = _shuffle(q['answers'])
            correct_idx = next(j for j, a in enumerate(shuffled_answers) if a['is_correct'])
            variant_questions.append({
                'question_id':  q['question_id'],
                'content':      q['content'],
                'answers':      [
                    {'answer_id': a['answer_id'], 'content': a['content'], 'label': LABELS[j]}
                    for j, a in enumerate(shuffled_answers)
                ],
                'correct_label': LABELS[correct_idx],
            })
        variants.append({'code': code, 'questions': variant_questions})
    return variants


# ── PDF builder ───────────────────────────────────────────────────────────────

class ExamPDF(FPDF):
    def __init__(self):
        super().__init__(orientation='P', unit='mm', format='A4')
        self.add_font('NotoSans',      style='',  fname=FONT_REGULAR)
        self.add_font('NotoSans',      style='B', fname=FONT_BOLD)
        self.set_auto_page_break(auto=True, margin=18)
        self.set_margins(left=20, top=20, right=20)

    def _divider(self, thick=False):
        self.set_draw_color(0, 0, 0)
        self.set_line_width(0.4 if thick else 0.2)
        self.line(self.get_x(), self.get_y(), self.w - 20, self.get_y())
        self.ln(3)

    def _info_line(self, label: str, width: float):
        self.set_font('NotoSans', 'B', 10)
        self.cell(self.get_string_width(label) + 1, 6, label)
        x_start = self.get_x()
        self.set_draw_color(100, 100, 100)
        self.set_line_width(0.2)
        self.line(x_start, self.get_y() + 5, x_start + width, self.get_y() + 5)
        self.cell(width + 2, 6, '')

    def add_exam_page(self, exam_name: str, duration: int, variant: dict):
        self.add_page()

        # ── Header ────────────────────────────────────────────────────────────
        self.set_font('NotoSans', '', 9)
        self.set_text_color(100, 100, 100)
        self.cell(0, 5, 'PHIẾU KIỂM TRA TOÁN LỚP 3', align='L', new_x='LMARGIN', new_y='NEXT')
        self.set_text_color(0, 0, 0)

        # Exam name (centered) + code box (right)
        self.set_font('NotoSans', 'B', 13)
        name_w = self.w - 40 - 40  # leave space for code box on the right
        self.cell(name_w, 7, exam_name, align='C')
        # Mã đề box
        code_text = f'Mã đề: {variant["code"]}'
        code_w    = self.get_string_width(code_text) + 8
        self.set_font('NotoSans', 'B', 11)
        self.set_draw_color(0, 0, 0)
        self.set_line_width(0.4)
        self.cell(code_w, 7, code_text, border=1, align='C', new_x='LMARGIN', new_y='NEXT')

        self.set_font('NotoSans', '', 10)
        self.set_text_color(60, 60, 60)
        self.cell(0, 5, f'Thời gian làm bài: {duration} phút', align='C', new_x='LMARGIN', new_y='NEXT')
        self.set_text_color(0, 0, 0)
        self.ln(2)

        self._divider(thick=True)

        # ── Student info ──────────────────────────────────────────────────────
        self._info_line('Họ và tên:', 80)
        self._info_line('Lớp:', 30)
        self.ln(8)
        self._info_line('Ngày kiểm tra:', 50)
        self._info_line('Điểm:', 25)
        self.ln(10)

        self._divider(thick=True)
        self.ln(2)

        # ── Questions ─────────────────────────────────────────────────────────
        for idx, q in enumerate(variant['questions'], start=1):
            # Question text
            self.set_font('NotoSans', 'B', 10)
            q_prefix = f'Câu {idx}: '
            prefix_w = self.get_string_width(q_prefix)
            self.cell(prefix_w, 6, q_prefix)
            self.set_font('NotoSans', '', 10)
            self.multi_cell(0, 6, q['content'], new_x='LMARGIN', new_y='NEXT')

            # Answers in 2-column grid
            col_w = (self.w - 40) / 2
            for i, ans in enumerate(q['answers']):
                if i % 2 == 0 and i != 0:
                    self.ln(0)
                x_offset = 5 + (col_w * (i % 2))
                self.set_x(self.l_margin + x_offset)
                self.set_font('NotoSans', 'B', 10)
                label_text = f'{ans["label"]}. '
                self.cell(self.get_string_width(label_text), 6, label_text)
                self.set_font('NotoSans', '', 10)
                self.cell(col_w - self.get_string_width(label_text) - 2, 6, ans['content'],
                          new_x='RIGHT' if i % 2 == 0 else 'LMARGIN',
                          new_y='LAST' if i % 2 == 0 else 'NEXT')

            if len(q['answers']) % 2 != 0:
                self.ln(6)
            self.ln(3)

    def add_answer_key_page(self, exam_name: str, variants: list):
        self.add_page()

        self.set_font('NotoSans', 'B', 14)
        self.cell(0, 8, 'BẢNG ĐÁP ÁN', align='C', new_x='LMARGIN', new_y='NEXT')
        self.set_font('NotoSans', '', 10)
        self.set_text_color(100, 100, 100)
        self.cell(0, 5, exam_name, align='C', new_x='LMARGIN', new_y='NEXT')
        self.set_text_color(0, 0, 0)
        self.ln(4)

        self._divider(thick=False)

        # Table header
        self.set_fill_color(243, 244, 246)
        self.set_font('NotoSans', 'B', 10)
        self.cell(22, 7, 'Mã đề', border='B', fill=True)
        self.cell(0,  7, 'Đáp án', border='B', fill=True, new_x='LMARGIN', new_y='NEXT')

        # Rows
        self.set_font('NotoSans', '', 10)
        for variant in variants:
            answers_str = '   '.join(
                f"{i + 1}.{q['correct_label']}"
                for i, q in enumerate(variant['questions'])
            )
            self.set_draw_color(220, 220, 220)
            self.set_line_width(0.2)
            self.cell(22, 7, variant['code'], border='B')
            self.multi_cell(0, 7, answers_str, border='B', new_x='LMARGIN', new_y='NEXT')


def build_exam_pdf(exam_name: str, duration: int, questions: list, variants_count: int) -> bytes:
    variants = generate_variants(questions, variants_count)

    pdf = ExamPDF()
    for variant in variants:
        pdf.add_exam_page(exam_name, duration, variant)
    pdf.add_answer_key_page(exam_name, variants)

    buf = io.BytesIO()
    pdf.output(buf)
    return buf.getvalue()
