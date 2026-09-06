import React, { useState, useMemo, useRef } from 'react';
import {
  Users,
  Upload,
  Download,
  Plus,
  Trash2,
  Edit3,
  Save,
  RotateCcw,
  CheckCircle,
  XCircle,
  Search,
  AlertTriangle,
  FileSpreadsheet,
  HelpCircle,
  X,
  Check,
  CheckSquare,
  Square,
  RefreshCw,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { StudentRosterItem, Post } from '../types';
import { INITIAL_STUDENTS_ROSTER } from '../data/challenges';
import { ConfirmModal } from './ConfirmModal';

interface StudentRosterManagerProps {
  roster: StudentRosterItem[];
  posts: Post[];
  currentMonth: number | 'all';
  onUpdateRoster: (newRoster: StudentRosterItem[]) => void;
  onResetRoster?: () => void;
  onToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
}

export const StudentRosterManager: React.FC<StudentRosterManagerProps> = ({
  roster,
  posts,
  currentMonth,
  onUpdateRoster,
  onResetRoster,
  onToast,
}) => {
  // Filters & Search
  const [rosterGradeFilter, setRosterGradeFilter] = useState<number | 'all'>('all');
  const [rosterClassFilter, setRosterClassFilter] = useState<number | 'all'>('all');
  const [rosterStatusFilter, setRosterStatusFilter] = useState<'all' | 'submitted' | 'unsubmitted'>('all');
  const [rosterSearch, setRosterSearch] = useState<string>('');

  // Selection for bulk actions
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Manual Add Student State
  const [isAddFormOpen, setIsAddFormOpen] = useState<boolean>(false);
  const [newGrade, setNewGrade] = useState<number>(1);
  const [newClassNum, setNewClassNum] = useState<number>(1);
  const [newStudentNum, setNewStudentNum] = useState<number>(1);
  const [newName, setNewName] = useState<string>('');

  // Inline Editing State
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editGrade, setEditGrade] = useState<number>(1);
  const [editClassNum, setEditClassNum] = useState<number>(1);
  const [editStudentNum, setEditStudentNum] = useState<number>(1);
  const [editName, setEditName] = useState<string>('');

  // Excel Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [uploadedStudents, setUploadedStudents] = useState<StudentRosterItem[]>([]);
  const [uploadFileName, setUploadFileName] = useState<string>('');
  const [uploadMode, setUploadMode] = useState<'replace' | 'merge'>('replace');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // In-app Confirm Modal state (Non-blocking in iframes)
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    subMessage?: string;
    confirmLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Compute detailed roster with submission status
  const rosterDetailedList = useMemo(() => {
    const activePosts = posts.filter((p) => !p.isDeleted);
    const targetMonth = currentMonth === 'all' ? 9 : currentMonth;

    return roster.map((student) => {
      const studentPosts = activePosts.filter(
        (p) =>
          p.grade === student.grade &&
          p.classNum === student.classNum &&
          (p.studentNum === student.studentNum || p.studentName.trim() === student.name.trim())
      );

      const submittedCurrent = studentPosts.some((p) => p.month === targetMonth);
      const submittedMonths = Array.from(new Set(studentPosts.map((p) => Number(p.month)))).sort(
        (a: number, b: number) => a - b
      );

      return {
        ...student,
        hasSubmittedCurrentMonth: submittedCurrent,
        submissionCount: studentPosts.length,
        submittedMonths,
        lastSubmittedAt: studentPosts[studentPosts.length - 1]?.createdAt,
      };
    });
  }, [roster, posts, currentMonth]);

  // Available classes in current roster
  const availableClasses = useMemo(() => {
    const classes = Array.from(new Set(roster.map((s) => Number(s.classNum)))).sort((a: number, b: number) => a - b);
    return classes.length > 0 ? classes : [1, 2, 3, 4];
  }, [roster]);

  // Filtered Roster
  const filteredRoster = useMemo(() => {
    return rosterDetailedList.filter((item) => {
      if (rosterGradeFilter !== 'all' && item.grade !== rosterGradeFilter) return false;
      if (rosterClassFilter !== 'all' && item.classNum !== rosterClassFilter) return false;
      if (rosterStatusFilter === 'submitted' && !item.hasSubmittedCurrentMonth) return false;
      if (rosterStatusFilter === 'unsubmitted' && item.hasSubmittedCurrentMonth) return false;
      if (rosterSearch.trim()) {
        const query = rosterSearch.toLowerCase();
        const matchName = item.name.toLowerCase().includes(query);
        const matchInfo = `${item.grade}학년 ${item.classNum}반 ${item.studentNum}번`.includes(query);
        if (!matchName && !matchInfo) return false;
      }
      return true;
    });
  }, [rosterDetailedList, rosterGradeFilter, rosterClassFilter, rosterStatusFilter, rosterSearch]);

  // Multi-select handlers
  const handleSelectAll = () => {
    if (selectedStudentIds.length === filteredRoster.length && filteredRoster.length > 0) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredRoster.map((s) => s.id));
    }
  };

  const handleToggleSelectStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // 1. Add Single Student
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      onToast('error', '이름 입력 필수', '학생 이름을 입력해주세요.');
      return;
    }

    const newId = `s-${newGrade}-${newClassNum}-${newStudentNum}-${Date.now()}`;
    const newStudent: StudentRosterItem = {
      id: newId,
      grade: Number(newGrade),
      classNum: Number(newClassNum),
      studentNum: Number(newStudentNum),
      name: newName.trim(),
    };

    // Check duplicate
    const exists = roster.some(
      (s) => s.grade === newStudent.grade && s.classNum === newStudent.classNum && s.studentNum === newStudent.studentNum
    );

    if (exists) {
      if (!window.confirm(`${newGrade}학년 ${newClassNum}반 ${newStudentNum}번에 이미 등록된 학생이 있습니다. 추가하시겠습니까?`)) {
        return;
      }
    }

    const updated = [...roster, newStudent].sort((a, b) => {
      if (a.grade !== b.grade) return a.grade - b.grade;
      if (a.classNum !== b.classNum) return a.classNum - b.classNum;
      return a.studentNum - b.studentNum;
    });

    onUpdateRoster(updated);
    setNewName('');
    setNewStudentNum((prev) => prev + 1);
    setIsAddFormOpen(false);
    onToast('success', '학생 등록 완료', `${newGrade}학년 ${newClassNum}반 ${newStudentNum}번 ${newName} 학생이 명부에 등록되었습니다.`);
  };

  // 2. Inline Edit Student
  const handleStartEdit = (student: StudentRosterItem) => {
    setEditingStudentId(student.id);
    setEditGrade(student.grade);
    setEditClassNum(student.classNum);
    setEditStudentNum(student.studentNum);
    setEditName(student.name);
  };

  const handleSaveEdit = (studentId: string) => {
    if (!editName.trim()) {
      onToast('error', '이름 필수', '학생 이름을 입력해주세요.');
      return;
    }

    const updated = roster.map((s) =>
      s.id === studentId
        ? {
            ...s,
            grade: Number(editGrade),
            classNum: Number(editClassNum),
            studentNum: Number(editStudentNum),
            name: editName.trim(),
          }
        : s
    ).sort((a, b) => {
      if (a.grade !== b.grade) return a.grade - b.grade;
      if (a.classNum !== b.classNum) return a.classNum - b.classNum;
      return a.studentNum - b.studentNum;
    });

    onUpdateRoster(updated);
    setEditingStudentId(null);
    onToast('success', '수정 완료', `${editGrade}학년 ${editClassNum}반 ${editStudentNum}번 ${editName} 정보가 수정되었습니다.`);
  };

  // 3. Delete Single Student
  const handleDeleteStudent = (student: StudentRosterItem) => {
    setConfirmModalState({
      isOpen: true,
      title: '학생 삭제 확인',
      message: `${student.grade}학년 ${student.classNum}반 ${student.studentNum}번 ${student.name} 학생을 명부에서 삭제하시겠습니까?`,
      subMessage: '명부에서 삭제된 학생은 현황판 및 미제출 목록 집계에서 제외됩니다.',
      confirmLabel: '삭제하기',
      isDestructive: true,
      onConfirm: () => {
        const updated = roster.filter((s) => s.id !== student.id);
        onUpdateRoster(updated);
        setSelectedStudentIds((prev) => prev.filter((id) => id !== student.id));
        onToast('info', '삭제 완료', `${student.name} 학생이 명부에서 삭제되었습니다.`);
      },
    });
  };

  // 4. Bulk Delete Selected Students
  const handleDeleteSelected = () => {
    if (selectedStudentIds.length === 0) return;
    setConfirmModalState({
      isOpen: true,
      title: '선택 학생 일괄 삭제',
      message: `선택한 ${selectedStudentIds.length}명의 학생을 명부에서 완전히 삭제하시겠습니까?`,
      subMessage: '삭제 후에는 해당 학생들의 명부 정보가 영구 제거됩니다.',
      confirmLabel: '일괄 삭제',
      isDestructive: true,
      onConfirm: () => {
        const updated = roster.filter((s) => !selectedStudentIds.includes(s.id));
        onUpdateRoster(updated);
        setSelectedStudentIds([]);
        onToast('info', '일괄 삭제 완료', `${selectedStudentIds.length}명의 학생이 삭제되었습니다.`);
      },
    });
  };

  // 5. Reset to Sample or Clear All
  const handleResetToSample = () => {
    setConfirmModalState({
      isOpen: true,
      title: '샘플 명부 복원',
      message: '기본 샘플 학생 명단(1~3학년 180명)으로 복원하시겠습니까?',
      subMessage: '현재 등록된 명단 전체가 기본 샘플 명단으로 대체됩니다.',
      confirmLabel: '복원하기',
      isDestructive: false,
      onConfirm: () => {
        if (onResetRoster) {
          onResetRoster();
        } else {
          onUpdateRoster(INITIAL_STUDENTS_ROSTER);
        }
        setSelectedStudentIds([]);
        onToast('success', '샘플 명단 복원 완료', '1~3학년 기본 학생 명부로 복원되었습니다.');
      },
    });
  };

  const handleClearAllRoster = () => {
    setConfirmModalState({
      isOpen: true,
      title: '전체 명부 비우기',
      message: '정말로 등록된 모든 학생 명부를 비우시겠습니까?',
      subMessage: '엑셀 파일로 새로운 명단을 업로드할 때 유용하며, 명부 데이터가 모두 초기화됩니다.',
      confirmLabel: '모두 비우기',
      isDestructive: true,
      onConfirm: () => {
        onUpdateRoster([]);
        setSelectedStudentIds([]);
        onToast('warning', '명부 초기화 완료', '모든 학생 명부가 비워졌습니다. 엑셀 업로드로 새 명단을 등록해주세요.');
      },
    });
  };

  // 6. Excel/CSV File Parse Logic
  const handleFileUpload = (file: File) => {
    if (!file) return;
    setUploadFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (!jsonData || jsonData.length === 0) {
          onToast('error', '파일 오류', '엑셀 파일에 데이터가 없습니다.');
          return;
        }

        // Find header row and index mappings
        let headerRowIndex = 0;
        let gradeIdx = -1;
        let classIdx = -1;
        let numIdx = -1;
        let nameIdx = -1;

        for (let r = 0; r < Math.min(jsonData.length, 5); r++) {
          const row = jsonData[r];
          if (!Array.isArray(row)) continue;

          row.forEach((cell, colIdx) => {
            const str = String(cell || '').trim().toLowerCase();
            if (str.includes('학년') || str === 'grade' || str === 'gr') gradeIdx = colIdx;
            else if (str.includes('반') || str === 'class' || str === '학급') classIdx = colIdx;
            else if (str.includes('번호') || str === 'num' || str === 'number' || str === 'no' || str === '번') numIdx = colIdx;
            else if (str.includes('이름') || str.includes('성명') || str === 'name' || str === '학생명') nameIdx = colIdx;
          });

          if (nameIdx !== -1) {
            headerRowIndex = r;
            break;
          }
        }

        // Fallback default column order if no headers detected: [학년, 반, 번호, 이름]
        if (nameIdx === -1) {
          gradeIdx = 0;
          classIdx = 1;
          numIdx = 2;
          nameIdx = 3;
          headerRowIndex = -1; // Start from row 0
        } else {
          // If grade/class/num wasn't found by keyword, assign defaults
          if (gradeIdx === -1) gradeIdx = 0;
          if (classIdx === -1) classIdx = 1;
          if (numIdx === -1) numIdx = 2;
        }

        const parsedList: StudentRosterItem[] = [];
        const startRow = headerRowIndex + 1;

        for (let r = startRow; r < jsonData.length; r++) {
          const row = jsonData[r];
          if (!Array.isArray(row) || row.length === 0) continue;

          const rawName = String(row[nameIdx] || '').trim();
          if (!rawName) continue; // Skip empty rows

          // Parse numbers safely
          const gradeVal = parseInt(String(row[gradeIdx] || '1').replace(/[^0-9]/g, ''), 10) || 1;
          const classVal = parseInt(String(row[classIdx] || '1').replace(/[^0-9]/g, ''), 10) || 1;
          const numVal = parseInt(String(row[numIdx] || `${parsedList.length + 1}`).replace(/[^0-9]/g, ''), 10) || (parsedList.length + 1);

          parsedList.push({
            id: `s-${gradeVal}-${classVal}-${numVal}-${r}`,
            grade: gradeVal,
            classNum: classVal,
            studentNum: numVal,
            name: rawName,
          });
        }

        if (parsedList.length === 0) {
          onToast('error', '데이터 없음', '인식 가능한 학생 이름 데이터를 찾을 수 없습니다.');
          return;
        }

        // Sort parsed list
        parsedList.sort((a, b) => {
          if (a.grade !== b.grade) return a.grade - b.grade;
          if (a.classNum !== b.classNum) return a.classNum - b.classNum;
          return a.studentNum - b.studentNum;
        });

        setUploadedStudents(parsedList);
        setIsUploadModalOpen(true);
        onToast('info', '엑셀 분석 완료', `${parsedList.length}명의 학생 데이터가 성공적으로 분석되었습니다. 미리보기를 확인해주세요.`);
      } catch (err: any) {
        console.error('Excel parse error:', err);
        onToast('error', '파일 파싱 실패', '엑셀 파일을 읽는 중 오류가 발생했습니다. 표준 양식(.xlsx 또는 .csv)을 사용해주세요.');
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Confirm and Apply Uploaded Students
  const handleConfirmUpload = () => {
    if (uploadedStudents.length === 0) return;

    let finalList: StudentRosterItem[] = [];

    if (uploadMode === 'replace') {
      finalList = [...uploadedStudents];
    } else {
      // Merge mode
      const existingMap = new Map<string, StudentRosterItem>();
      roster.forEach((s) => {
        const key = `${s.grade}-${s.classNum}-${s.studentNum}`;
        existingMap.set(key, s);
      });

      uploadedStudents.forEach((s) => {
        const key = `${s.grade}-${s.classNum}-${s.studentNum}`;
        existingMap.set(key, s);
      });

      finalList = Array.from(existingMap.values());
    }

    // Sort cleanly
    finalList.sort((a, b) => {
      if (a.grade !== b.grade) return a.grade - b.grade;
      if (a.classNum !== b.classNum) return a.classNum - b.classNum;
      return a.studentNum - b.studentNum;
    });

    onUpdateRoster(finalList);
    setIsUploadModalOpen(false);
    setUploadedStudents([]);
    setSelectedStudentIds([]);
    onToast(
      'success',
      '학생 명부 등록 완료!',
      `총 ${finalList.length}명의 학생 명부가 안전하게 반영 및 저장되었습니다.`
    );
  };

  // 7. Download Sample Template (.xlsx)
  const handleDownloadSampleExcel = () => {
    const sampleData = [
      { 학년: 1, 반: 1, 번호: 1, 이름: '강동원' },
      { 학년: 1, 반: 1, 번호: 2, 이름: '김태리' },
      { 학년: 1, 반: 1, 번호: 3, 이름: '박보검' },
      { 학년: 1, 반: 2, 번호: 1, 이름: '고윤정' },
      { 학년: 2, 반: 1, 번호: 1, 이름: '공유' },
      { 학년: 3, 반: 1, 번호: 1, 이름: '김수현' },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '학생명부_양식');
    XLSX.writeFile(workbook, '독서챌린지_학생명단_표준양식.xlsx');
    onToast('success', '양식 다운로드 완료', '학생명단 표준 엑셀 양식이 다운로드되었습니다.');
  };

  // 8. Download Sample Template (.csv)
  const handleDownloadSampleCsv = () => {
    const csvContent = '\uFEFF학년,반,번호,이름\n1,1,1,강동원\n1,1,2,김태리\n1,1,3,박보검\n1,2,1,고윤정\n2,1,1,공유\n3,1,1,김수현\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', '독서챌린지_학생명단_표준양식.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onToast('success', '양식 다운로드 완료', '학생명단 CSV 양식이 다운로드되었습니다.');
  };

  // 9. Export Current Roster & Participation (.xlsx)
  const handleExportRosterExcel = () => {
    const targetMonth = currentMonth === 'all' ? 9 : currentMonth;
    const exportData = filteredRoster.map((s) => ({
      학년: s.grade,
      반: s.classNum,
      번호: s.studentNum,
      이름: s.name,
      [`${targetMonth}월_참여여부`]: s.hasSubmittedCurrentMonth ? '제출완료' : '미제출',
      누적_인증횟수: s.submissionCount || 0,
      참여완료한달: (s.submittedMonths || []).map((m) => `${m}월`).join(', ') || '없음',
      최근제출일시: s.lastSubmittedAt ? new Date(s.lastSubmittedAt).toLocaleString('ko-KR') : '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '학생명부_참여현황');
    XLSX.writeFile(workbook, `독서챌린지_학생명부_참여현황_${new Date().toISOString().slice(0, 10)}.xlsx`);
    onToast('success', '명부 다운로드 완료', '현재 학생 명부 및 챌린지 참여 현황이 엑셀 파일로 저장되었습니다.');
  };

  return (
    <div className="bg-white rounded-[2rem] p-5 sm:p-7 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6">
      {/* Top Header & Overview Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b-4 border-black pb-5">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-xl font-black text-black flex items-center gap-2">
              <Users className="w-6 h-6 text-[#FF6B00]" />
              <span>👥 학생 명부 관리 & 엑셀 업로드</span>
            </h3>
            <span className="text-xs font-black bg-[#4ADE80] text-black px-3 py-1 rounded-full border-2 border-black">
              등록된 전교생 {roster.length}명
            </span>
          </div>
          <p className="text-xs sm:text-sm font-bold text-slate-600 mt-1">
            엑셀(.xlsx, .csv) 파일로 전교생 명단을 한 번에 등록하거나, 학생을 직접 추가·수정·삭제할 수 있습니다.
          </p>
        </div>

        {/* Action Buttons Bar */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Excel Upload Trigger Button */}
          <button
            id="btn-open-excel-upload"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#4ADE80] hover:bg-[#3ecf73] text-black font-black text-xs border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-y-[-1px] active:translate-y-[1px] transition flex items-center justify-center gap-1.5"
          >
            <Upload className="w-4 h-4 text-black" />
            <span>📊 엑셀/CSV 명단 업로드</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleFileUpload(file);
                e.target.value = '';
              }
            }}
          />

          {/* Add Student Toggle Button */}
          <button
            id="btn-toggle-add-student"
            onClick={() => setIsAddFormOpen((prev) => !prev)}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-blue-600 text-white font-black text-xs border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-y-[-1px] active:translate-y-[1px] transition flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>➕ 학생 직접 추가</span>
          </button>

          {/* Export Excel Button */}
          <button
            id="btn-export-roster-excel"
            onClick={handleExportRosterExcel}
            className="px-3 py-2.5 rounded-xl bg-[#FFD100] hover:bg-yellow-300 text-black font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition flex items-center gap-1"
            title="현재 학생 명부 및 참여 현황 엑셀 다운로드"
          >
            <Download className="w-3.5 h-3.5 text-black" />
            <span>명부 다운로드</span>
          </button>
        </div>
      </div>

      {/* Manual Single Student Add Drawer */}
      {isAddFormOpen && (
        <form
          onSubmit={handleAddStudent}
          className="bg-[#EFF6FF] p-4 sm:p-5 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-black flex items-center gap-2">
              <span>➕ 신규 학생 1명 직접 등록</span>
            </h4>
            <button
              type="button"
              onClick={() => setIsAddFormOpen(false)}
              className="text-slate-500 hover:text-black"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-black text-black mb-1">학년</label>
              <select
                value={newGrade}
                onChange={(e) => setNewGrade(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white rounded-xl border-2 border-black font-bold text-xs"
              >
                <option value={1}>1학년</option>
                <option value={2}>2학년</option>
                <option value={3}>3학년</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-black text-black mb-1">반</label>
              <input
                type="number"
                min={1}
                max={20}
                value={newClassNum}
                onChange={(e) => setNewClassNum(Number(e.target.value))}
                placeholder="예: 1"
                className="w-full px-3 py-2 bg-white rounded-xl border-2 border-black font-bold text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-black mb-1">번호</label>
              <input
                type="number"
                min={1}
                max={50}
                value={newStudentNum}
                onChange={(e) => setNewStudentNum(Number(e.target.value))}
                placeholder="예: 15"
                className="w-full px-3 py-2 bg-white rounded-xl border-2 border-black font-bold text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-black mb-1">학생 이름</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="예: 홍길동"
                className="w-full px-3 py-2 bg-white rounded-xl border-2 border-black font-bold text-xs"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddFormOpen(false)}
              className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 font-bold text-xs"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-[#3B82F6] hover:bg-blue-600 text-white font-black text-xs border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>명부에 등록하기</span>
            </button>
          </div>
        </form>
      )}

      {/* Guide Banner & Sample Template Links */}
      <div className="bg-[#FFFBEB] p-4 rounded-2xl border-2 border-black flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5">
          <HelpCircle className="w-5 h-5 text-[#FF6B00] shrink-0 mt-0.5" />
          <div>
            <span className="font-black text-black">💡 엑셀 일괄 업로드 가이드:</span>
            <p className="text-slate-700 font-medium mt-0.5">
              엑셀 첫 번째 행에 <strong>[학년, 반, 번호, 이름]</strong> 열을 작성하여 업로드하시면 전교생 명단이 즉시 등록됩니다.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-black text-slate-600">표준 양식:</span>
          <button
            onClick={handleDownloadSampleExcel}
            className="px-2.5 py-1 rounded-lg bg-white hover:bg-yellow-50 text-slate-800 font-bold text-[11px] border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>엑셀 양식(.xlsx)</span>
          </button>
          <button
            onClick={handleDownloadSampleCsv}
            className="px-2.5 py-1 rounded-lg bg-white hover:bg-yellow-50 text-slate-800 font-bold text-[11px] border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
            <span>CSV 양식(.csv)</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Status Filter Chips */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border-2 border-black text-xs font-black">
            <button
              id="roster-filter-all"
              onClick={() => setRosterStatusFilter('all')}
              className={`px-3 py-1 rounded-lg transition ${
                rosterStatusFilter === 'all' ? 'bg-black text-white' : 'text-slate-600 hover:text-black'
              }`}
            >
              전체 ({rosterDetailedList.length})
            </button>
            <button
              id="roster-filter-submitted"
              onClick={() => setRosterStatusFilter('submitted')}
              className={`px-3 py-1 rounded-lg transition ${
                rosterStatusFilter === 'submitted' ? 'bg-[#4ADE80] text-black' : 'text-slate-600 hover:text-black'
              }`}
            >
              ✅ 제출 완료 ({rosterDetailedList.filter((r) => r.hasSubmittedCurrentMonth).length})
            </button>
            <button
              id="roster-filter-unsubmitted"
              onClick={() => setRosterStatusFilter('unsubmitted')}
              className={`px-3 py-1 rounded-lg transition ${
                rosterStatusFilter === 'unsubmitted' ? 'bg-[#EF4444] text-white' : 'text-slate-600 hover:text-black'
              }`}
            >
              ❌ 미제출 ({rosterDetailedList.filter((r) => !r.hasSubmittedCurrentMonth).length})
            </button>
          </div>

          {/* Bulk Selection Actions */}
          {selectedStudentIds.length > 0 && (
            <div className="flex items-center gap-2 bg-red-50 p-1.5 px-3 rounded-xl border-2 border-red-500 text-xs animate-pulse">
              <span className="font-black text-red-600">
                {selectedStudentIds.length}명 선택됨
              </span>
              <button
                onClick={handleDeleteSelected}
                className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-black flex items-center gap-1 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>선택 일괄 삭제</span>
              </button>
            </div>
          )}
        </div>

        {/* Search & Grade/Class Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="roster-search-input"
              type="text"
              value={rosterSearch}
              onChange={(e) => setRosterSearch(e.target.value)}
              placeholder="학생 이름 또는 학년/반/번호 검색..."
              className="w-full pl-9 pr-3 py-2 bg-white border-2 border-black rounded-xl font-bold"
            />
          </div>

          <div>
            <select
              id="roster-grade-select"
              value={rosterGradeFilter}
              onChange={(e) =>
                setRosterGradeFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
              className="w-full bg-white border-2 border-black rounded-xl px-3 py-2 font-bold"
            >
              <option value="all">전체 학년</option>
              {[1, 2, 3].map((g) => (
                <option key={g} value={g}>
                  {g}학년
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              id="roster-class-select"
              value={rosterClassFilter}
              onChange={(e) =>
                setRosterClassFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
              className="w-full bg-white border-2 border-black rounded-xl px-3 py-2 font-bold"
            >
              <option value="all">전체 반</option>
              {availableClasses.map((c) => (
                <option key={c} value={c}>
                  {c}반
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="border-2 border-black rounded-2xl overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
        <div className="overflow-x-auto max-h-[460px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FFD100] text-black font-black uppercase border-b-2 border-black sticky top-0 z-10">
              <tr>
                <th className="px-3 py-3 w-10 text-center">
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center justify-center text-black hover:opacity-70"
                    title="전체 선택"
                  >
                    {selectedStudentIds.length === filteredRoster.length && filteredRoster.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-black" />
                    ) : (
                      <Square className="w-4 h-4 text-black" />
                    )}
                  </button>
                </th>
                <th className="px-3 py-3">학년/반/번호</th>
                <th className="px-4 py-3">학생 이름</th>
                <th className="px-3 py-3 text-center">이번 달 ({currentMonth === 'all' ? '9' : currentMonth}월) 참여</th>
                <th className="px-3 py-3 text-center">누적 인증</th>
                <th className="px-3 py-3">참여 완료 달</th>
                <th className="px-3 py-3 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-bold bg-white">
              {filteredRoster.map((student) => {
                const isSelected = selectedStudentIds.includes(student.id);
                const isEditing = editingStudentId === student.id;

                if (isEditing) {
                  return (
                    <tr key={student.id} className="bg-yellow-100/70">
                      <td className="px-3 py-2 text-center">
                        <span className="text-[10px] font-black text-amber-700">수정중</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <select
                            value={editGrade}
                            onChange={(e) => setEditGrade(Number(e.target.value))}
                            className="bg-white border border-black rounded p-1 text-xs font-bold"
                          >
                            <option value={1}>1</option>
                            <option value={2}>2</option>
                            <option value={3}>3</option>
                          </select>
                          <span>학년</span>
                          <input
                            type="number"
                            value={editClassNum}
                            onChange={(e) => setEditClassNum(Number(e.target.value))}
                            className="w-12 bg-white border border-black rounded p-1 text-xs font-bold text-center"
                          />
                          <span>반</span>
                          <input
                            type="number"
                            value={editStudentNum}
                            onChange={(e) => setEditStudentNum(Number(e.target.value))}
                            className="w-12 bg-white border border-black rounded p-1 text-xs font-bold text-center"
                          />
                          <span>번</span>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full bg-white border border-black rounded p-1 text-xs font-bold"
                          placeholder="학생 이름"
                        />
                      </td>
                      <td colSpan={3} className="px-3 py-2 text-center text-slate-400">
                        수정 후 저장을 눌러주세요
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleSaveEdit(student.id)}
                            className="px-2 py-1 rounded bg-[#4ADE80] text-black font-black text-[11px] border border-black flex items-center gap-0.5"
                          >
                            <Save className="w-3 h-3" />
                            저장
                          </button>
                          <button
                            onClick={() => setEditingStudentId(null)}
                            className="px-2 py-1 rounded bg-slate-200 text-slate-700 font-bold text-[11px]"
                          >
                            취소
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr
                    key={student.id}
                    className={`hover:bg-yellow-50/60 transition ${
                      isSelected ? 'bg-amber-50' : !student.hasSubmittedCurrentMonth ? 'bg-red-50/20' : ''
                    }`}
                  >
                    <td className="px-3 py-2.5 text-center">
                      <button
                        onClick={() => handleToggleSelectStudent(student.id)}
                        className="flex items-center justify-center mx-auto text-slate-500 hover:text-black"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-[#3B82F6]" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300" />
                        )}
                      </button>
                    </td>
                    <td className="px-3 py-2.5 text-slate-800">
                      {student.grade}학년 {student.classNum}반 {student.studentNum}번
                    </td>
                    <td className="px-4 py-2.5 font-black text-black">
                      {student.name}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {student.hasSubmittedCurrentMonth ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-black bg-[#4ADE80] text-black px-2.5 py-0.5 rounded-full border border-black">
                          <CheckCircle className="w-3.5 h-3.5" />
                          제출완료
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-black bg-[#EF4444] text-white px-2.5 py-0.5 rounded-full border border-black">
                          <XCircle className="w-3.5 h-3.5" />
                          미제출
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center font-black">
                      {student.submissionCount || 0}회
                    </td>
                    <td className="px-3 py-2.5">
                      {student.submittedMonths && student.submittedMonths.length > 0 ? (
                        <div className="flex gap-1 flex-wrap">
                          {student.submittedMonths.map((m) => (
                            <span
                              key={m}
                              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] border border-black"
                            >
                              {m}월
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 font-normal">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleStartEdit(student)}
                          className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-black"
                          title="학생 정보 수정"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(student)}
                          className="p-1 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-600"
                          title="명부에서 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredRoster.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400 font-bold space-y-2">
                    <Users className="w-8 h-8 mx-auto text-slate-300" />
                    <p>등록된 학생이 없거나 검색 조건과 일치하지 않습니다.</p>
                    <p className="text-xs text-slate-400">
                      상단의 [📊 엑셀/CSV 명단 업로드] 버튼을 눌러 학생 명부를 등록해주세요.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Roster Bottom Utilities & Danger Zone */}
      <div className="pt-3 border-t-2 border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="text-slate-500 font-bold">
          전체 명부 {roster.length}명 중 {filteredRoster.length}명 표시 중
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetToSample}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-300 flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>기본 샘플 명단(180명) 복원</span>
          </button>

          <button
            onClick={handleClearAllRoster}
            className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold border border-red-200 flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>전체 명단 비우기</span>
          </button>
        </div>
      </div>

      {/* EXCEL UPLOAD PREVIEW & CONFIRMATION MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2.5rem] p-6 sm:p-7 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <div className="bg-[#4ADE80] p-2 rounded-xl border-2 border-black">
                  <FileSpreadsheet className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-black">
                    📊 엑셀 명단 업로드 미리보기
                  </h3>
                  <p className="text-xs font-bold text-slate-500">
                    파일명: {uploadFileName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Analysis Stats */}
            <div className="bg-[#EFF6FF] p-4 rounded-2xl border-2 border-black space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-blue-900">
                  🎉 총 {uploadedStudents.length}명의 학생 데이터가 성공적으로 인식되었습니다!
                </span>
                <span className="text-[11px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-full">
                  정상 파싱
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 text-[11px] font-bold text-blue-800">
                <span>학년별 분포:</span>
                {[1, 2, 3].map((g) => {
                  const count = uploadedStudents.filter((s) => s.grade === g).length;
                  return count > 0 ? (
                    <span key={g} className="bg-white px-2 py-0.5 rounded-md border border-blue-200">
                      {g}학년: {count}명
                    </span>
                  ) : null;
                })}
              </div>
            </div>

            {/* Preview Table of First 8 Rows */}
            <div className="space-y-1.5">
              <span className="text-xs font-black text-black">
                👀 상위 데이터 미리보기 (총 {uploadedStudents.length}명 중 {Math.min(8, uploadedStudents.length)}명 표시)
              </span>
              <div className="border-2 border-black rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-black font-black uppercase border-b border-black">
                    <tr>
                      <th className="px-3 py-2">학년</th>
                      <th className="px-3 py-2">반</th>
                      <th className="px-3 py-2">번호</th>
                      <th className="px-3 py-2">이름</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold bg-white">
                    {uploadedStudents.slice(0, 8).map((s, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-3 py-1.5">{s.grade}학년</td>
                        <td className="px-3 py-1.5">{s.classNum}반</td>
                        <td className="px-3 py-1.5">{s.studentNum}번</td>
                        <td className="px-3 py-1.5 font-black text-black">{s.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Upload Mode Selector */}
            <div className="space-y-2 pt-2 border-t-2 border-slate-100">
              <span className="text-xs font-black text-black">등록 모드 선택:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <label
                  onClick={() => setUploadMode('replace')}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition flex items-start gap-2.5 ${
                    uploadMode === 'replace'
                      ? 'border-black bg-yellow-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                      : 'border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="uploadMode"
                    checked={uploadMode === 'replace'}
                    onChange={() => setUploadMode('replace')}
                    className="mt-0.5"
                  />
                  <div>
                    <strong className="block font-black text-black">🔄 전체 덮어쓰기 (권장)</strong>
                    <span className="text-[11px] text-slate-500">
                      기존 명단을 모두 지우고 새 엑셀 파일로 전교생 명부를 완전히 교체합니다.
                    </span>
                  </div>
                </label>

                <label
                  onClick={() => setUploadMode('merge')}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition flex items-start gap-2.5 ${
                    uploadMode === 'merge'
                      ? 'border-black bg-yellow-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                      : 'border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="uploadMode"
                    checked={uploadMode === 'merge'}
                    onChange={() => setUploadMode('merge')}
                    className="mt-0.5"
                  />
                  <div>
                    <strong className="block font-black text-black">➕ 기존 명단에 병합(추가)</strong>
                    <span className="text-[11px] text-slate-500">
                      기존 명단은 유지하고 새 학생들을 추가합니다 (동일 번호는 덮어씀).
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Modal Bottom Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-black">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmUpload}
                className="px-6 py-2.5 rounded-xl bg-[#4ADE80] hover:bg-[#3ecf73] text-black font-black text-xs sm:text-sm border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-y-[-1px] active:translate-y-[1px] transition flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 text-black" />
                <span>💾 {uploadedStudents.length}명 명단 최종 반영하기</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-app Non-blocking Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        title={confirmModalState.title}
        message={confirmModalState.message}
        subMessage={confirmModalState.subMessage}
        confirmLabel={confirmModalState.confirmLabel}
        isDestructive={confirmModalState.isDestructive}
        onConfirm={confirmModalState.onConfirm}
        onClose={() => setConfirmModalState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
