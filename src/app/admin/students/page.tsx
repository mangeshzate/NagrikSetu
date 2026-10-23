"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import { dataStore } from "@/lib/database/store";
import { StudentUserSummary } from "@/types/database";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { 
  Users, 
  ArrowLeft, 
  Search, 
  Trash2, 
  Eye, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  GraduationCap, 
  Lock,
  Calendar
} from "lucide-react";

export default function AdminStudentsPage() {
  const { language, t } = useLanguage();
  const { user } = useAuth();

  const [students, setStudents] = useState<StudentUserSummary[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // View modal state
  const [studentToView, setStudentToView] = useState<StudentUserSummary | null>(null);

  // Delete modal state
  const [studentToDelete, setStudentToDelete] = useState<StudentUserSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadStudents = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/admin/students?search=${encodeURIComponent(searchTerm)}&page=${page}&limit=10`
      );
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students);
        setTotalStudents(data.total);
      } else {
        // Fallback to client dataStore
        const clientData = await dataStore.getAllStudents({
          search: searchTerm,
          page,
          limit: 10,
        });
        setStudents(clientData.students);
        setTotalStudents(clientData.total);
      }
    } catch {
      const clientData = await dataStore.getAllStudents({
        search: searchTerm,
        page,
        limit: 10,
      });
      setStudents(clientData.students);
      setTotalStudents(clientData.total);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchTerm]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/admin/students/${studentToDelete.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete student account.");
      }

      await loadStudents();
      setStudentToDelete(null);
    } catch (e: any) {
      setDeleteError(e?.message || "Failed to delete student account.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="py-20 text-center space-y-4 max-w-md mx-auto">
        <Lock className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Admin Authorization Required</h2>
        <Link href="/login">
          <Button size="sm" variant="primary">Login as Admin</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 font-marathi">
            Student Management Directory
          </h1>
          <p className="text-xs text-slate-500">
            Privacy-conscious student directory. Sensitive credentials, passwords, and OTPs are strictly excluded.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700">
          <Users className="w-4 h-4 text-civic-700" />
          <span>Total Students: <strong>{totalStudents}</strong></span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name, email, or district (e.g. Pune, Nagpur, Nashik)..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-civic-500/20 focus:border-civic-600"
          />
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-3">Location & Education</th>
                <th className="py-3.5 px-3">Masked Mobile</th>
                <th className="py-3.5 px-3">Onboarding</th>
                <th className="py-3.5 px-3">Active Journeys</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No students found matching your search.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900">{student.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{student.email}</p>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1 text-slate-800 font-medium">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{student.district || "Maharashtra"}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        {student.educationLevel || "Student"}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                      {student.maskedMobile}
                    </td>
                    <td className="py-3.5 px-3">
                      {student.onboardingCompleted ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Completed</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <span>Pending</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 font-medium text-slate-800">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[11px] font-bold">
                        {student.activeJourneysCount}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setStudentToView(student)}
                          title="View Student Summary"
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setStudentToDelete(student)}
                          title="Delete Student Account"
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Student Drawer / Modal */}
      <Modal
        isOpen={!!studentToView}
        onClose={() => setStudentToView(null)}
        title="Student Profile Overview"
      >
        {studentToView && (
          <div className="space-y-4 text-xs text-slate-700">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">{studentToView.name}</span>
                <Badge variant="emerald" size="sm">STUDENT</Badge>
              </div>
              <p className="text-slate-500 font-mono">{studentToView.email}</p>
              <p className="text-slate-500 font-mono">Mobile: {studentToView.maskedMobile}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">District</span>
                <p className="font-semibold text-slate-900">{studentToView.district || "Maharashtra"}</p>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Education Level</span>
                <p className="font-semibold text-slate-900">{studentToView.educationLevel || "Not provided"}</p>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Onboarding Status</span>
                <p className="font-semibold text-slate-900">
                  {studentToView.onboardingCompleted ? "Completed" : "Incomplete"}
                </p>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Active Journeys</span>
                <p className="font-semibold text-slate-900">{studentToView.activeJourneysCount} Roadmaps</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" variant="outline" onClick={() => setStudentToView(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Student Account Confirmation Modal (Section 5 requirement) */}
      <Modal
        isOpen={!!studentToDelete}
        onClose={() => {
          if (!isDeleting) {
            setStudentToDelete(null);
            setDeleteError(null);
          }
        }}
        title="Delete Student Account / विद्यार्थी खाते हटवा"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs text-rose-900 leading-relaxed">
              <p className="font-bold">
                Permanently delete account for {studentToDelete?.name} ({studentToDelete?.email})?
              </p>
              <p>
                This action is permanent and irreversible. It will safely purge:
              </p>
              <ul className="list-disc pl-4 space-y-0.5 text-rose-800">
                <li>Student Profile & Educational Details</li>
                <li>All Action Journeys & Progress Steps</li>
                <li>Document Checklist & Eligibility Questionnaire Answers</li>
              </ul>
              <p className="font-medium pt-1">
                This operation will be logged to the immutable security audit trail.
              </p>
            </div>
          </div>

          {deleteError && (
            <div className="p-3 rounded-xl bg-rose-100 text-xs text-rose-800 font-semibold">
              {deleteError}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStudentToDelete(null);
                setDeleteError(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Trash2 className="w-4 h-4 text-white" />}
              onClick={handleDeleteStudent}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Permanently Delete Student"}
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
