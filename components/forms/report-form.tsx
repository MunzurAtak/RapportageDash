"use client";

import { useMemo, useState } from "react";
import { submitReport } from "@/app/rapportages/actions";

type StudentOption = {
  id: string;
  full_name: string;
  grade_level: string | null;
};

type ReportFormProps = {
  students: StudentOption[];
  selectedStudentId?: string;
  tutorName: string;
  tutorEmail: string;
  periodName: string;
  deadline?: string;
  errorMessage: string | null;
};

export function ReportForm({
  students,
  selectedStudentId,
  tutorName,
  tutorEmail,
  periodName,
  deadline,
  errorMessage,
}: ReportFormProps) {
  const [studentId, setStudentId] = useState(
    selectedStudentId || students[0]?.id || ""
  );

  const selectedStudent = useMemo(() => {
    return students.find((student) => student.id === studentId) ?? null;
  }, [students, studentId]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-xl font-semibold text-slate-900">
          Maandelijkse Progressie Formulier
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Vul de maandelijkse voortgangsrapportage in voor een van je
          gekoppelde leerlingen.
        </p>
        <p className="mt-1 text-xs text-slate-500">* Verplichte vraag</p>
      </div>

      {errorMessage && (
        <div className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <form action={submitReport} className="mt-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            1. E-mailadres *
          </label>
          <input
            value={tutorEmail}
            readOnly
            className="mt-2 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            2. Voor- en achternaam begeleider *
          </label>
          <input
            value={tutorName}
            readOnly
            className="mt-2 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            3. Voor- en achternaam leerling *
          </label>
          <select
            name="studentId"
            required
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
          >
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.full_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            4. Leerjaar leerling *
          </label>
          <input
            value={selectedStudent?.grade_level || "Nog niet ingevuld"}
            readOnly
            className="mt-2 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            5. Maand *
          </label>
          <select
            value={periodName}
            disabled
            className="mt-2 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900"
          >
            <option>{periodName}</option>
          </select>

          {deadline && (
            <p className="mt-2 text-xs text-slate-500">
              Deadline: {deadline}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            6. Beschrijf gedetailleerd welke specifieke vaardigheden de leerling
            de afgelopen maand heeft verbeterd. *
          </label>
          <textarea
            name="improvedSkills"
            required
            rows={5}
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900"
            placeholder="Bijvoorbeeld: rekenen met breuken, begrijpend lezen, concentratie, planning..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            7. Welke doelen van vorige maand zijn behaald? *
          </label>
          <textarea
            name="achievedGoals"
            required
            rows={5}
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900"
            placeholder="Beschrijf concreet welke doelen zijn gehaald."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            8. Wat zijn de doelstellingen voor de volgende maand? Wees
            gedetailleerd. *
          </label>
          <textarea
            name="nextGoals"
            required
            rows={5}
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900"
            placeholder="Beschrijf de doelen voor de volgende maand."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            9. Overige opmerkingen {"("}gedrag, lesvoorbereiding, aanwezigheid
            {")"} *
          </label>
          <textarea
            name="additionalNotes"
            required
            rows={4}
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900"
            placeholder="Bijvoorbeeld: inzet, aanwezigheid, huiswerk, gedrag tijdens de les..."
          />
        </div>

        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          Rapportage indienen
        </button>
      </form>
    </div>
  );
}
