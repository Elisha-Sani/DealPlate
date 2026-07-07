"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import {
    Camera,
    FileText,
    Loader2,
    ShieldAlert,
    UserCheck,
} from "lucide-react";
import StepIndicator from "@/components/ui/StepIndicator";
import { useUser } from "@/providers/UserProvider";
import { supabase } from "@/lib/supabase/client";
import { validateStudentKyc } from "@/app/actions/validateStudentKyc";

interface AcademicDetails {
    university: string;
    regNumber: string;
}

function readFileAsDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export default function StudentUploadId() {
    const router = useRouter();
    const { user, setUser } = useUser();
    const [details, setDetails] = useState<AcademicDetails | null>(null);
    const [studentIdFile, setStudentIdFile] = useState<File | null>(null);
    const [universityDocFile, setUniversityDocFile] = useState<File | null>(
        null,
    );
    const [documentDate, setDocumentDate] = useState("");
    const [error, setError] = useState("");
    const [status, setStatus] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const rawDetails = sessionStorage.getItem(
            "dealplate_student_kyc_details",
        );
        if (rawDetails) setDetails(JSON.parse(rawDetails));
    }, []);

    useEffect(() => {
        if (!user) router.push("/student/sign-in");
    }, [router, user]);

    const handleSubmit = async () => {
        if (!user?.id) return;
        if (!details) {
            setError("Start with your academic details first.");
            router.push("/student/verify");
            return;
        }
        if (!studentIdFile || !universityDocFile || !documentDate) {
            setError(
                "Upload your student ID, a recent university document, and the document date.",
            );
            return;
        }
        if (
            studentIdFile.size > 2_000_000 ||
            universityDocFile.size > 2_000_000
        ) {
            setError("Each file must be under 5MB.");
            return;
        }

        setError("");
        setStatus("Preparing documents...");
        setIsSubmitting(true);

        try {
            const studentIdDataUrl = await readFileAsDataUrl(studentIdFile);
            const universityDocDataUrl =
                await readFileAsDataUrl(universityDocFile);

            setStatus("Running AI document checks...");
            const aiReview = await validateStudentKyc({
                fullName: user.fullName,
                university: details.university,
                regNumber: details.regNumber,
                documentDate,
                documents: [
                    {
                        label: "student_id",
                        fileName: studentIdFile.name,
                        mimeType: studentIdFile.type,
                        dataUrl: studentIdDataUrl,
                    },
                    {
                        label: "university_document",
                        fileName: universityDocFile.name,
                        mimeType: universityDocFile.type,
                        dataUrl: universityDocDataUrl,
                    },
                ],
            });

            setStatus("Submitting KYC application...");
            await supabase
                .from("student_profiles")
                .update({
                    university: details.university,
                    reg_number: details.regNumber,
                    is_verified: false,
                    id_photo_url: studentIdDataUrl,
                })
                .eq("id", user.id);

            const { error: insertError } = await supabase
                .from("student_kyc_applications")
                .insert({
                    student_id: user.id,
                    full_name: user.fullName,
                    email: user.email,
                    phone: user.phone,
                    university: details.university,
                    reg_number: details.regNumber,
                    student_id_file_name: studentIdFile.name,
                    university_doc_file_name: universityDocFile.name,
                    university_doc_date: documentDate,
                    document_data: {
                        studentId: studentIdDataUrl,
                        universityDocument: universityDocDataUrl,
                    },
                    ai_recommendation: aiReview.recommendation,
                    ai_confidence: aiReview.confidence,
                    ai_summary: aiReview.summary,
                    ai_flags: aiReview.flags,
                    status: "pending_review",
                });

            if (insertError) throw insertError;

            setUser((prev) =>
                prev
                    ? {
                          ...prev,
                          university: details.university,
                          regNumber: details.regNumber,
                          isVerified: false,
                          avatar: studentIdDataUrl,
                      }
                    : prev,
            );
            sessionStorage.removeItem("dealplate_student_kyc_details");
            setStatus("Application submitted for superadmin review.");
            router.push("/student/profile");
        } catch (err: any) {
            setError(err?.message || "KYC submission failed.");
            setStatus("");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!user) return null;

    return (
        <motion.div
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-130 w-full mx-auto py-4"
        >
            <StepIndicator
                currentStep={2}
                totalSteps={2}
                label="KYC Documents"
            />

            <div className="text-center mb-8">
                <h2 className="font-display font-extrabold text-2xl tracking-tight text-[#111827] mb-2">
                    Upload Student KYC
                </h2>
                <p className="text-[#5a4136] text-sm max-w-md mx-auto">
                    Upload your school ID and one university document dated
                    within the last six months, such as a fee statement.
                </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#F3F4F6] p-6 shadow-md flex flex-col">
                {error && (
                    <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4" />
                        <span>{error}</span>
                    </div>
                )}
                {status && (
                    <div className="mb-4 bg-orange-50 text-[#FF6B00] p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
                        {isSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <UserCheck className="w-4 h-4" />
                        )}
                        <span>{status}</span>
                    </div>
                )}

                <div className="space-y-4">
                    <label className="block">
                        <span className="block text-xs font-bold text-[#5a4136] uppercase tracking-wider mb-2">
                            Student ID card
                        </span>
                        <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) =>
                                setStudentIdFile(e.target.files?.[0] || null)
                            }
                            className="w-full text-sm"
                        />
                    </label>
                    <label className="block">
                        <span className="block text-xs font-bold text-[#5a4136] uppercase tracking-wider mb-2">
                            Recent university document
                        </span>
                        <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) =>
                                setUniversityDocFile(
                                    e.target.files?.[0] || null,
                                )
                            }
                            className="w-full text-sm"
                        />
                    </label>
                    <label className="block">
                        <span className="block text-xs font-bold text-[#5a4136] uppercase tracking-wider mb-2">
                            Document issue date
                        </span>
                        <input
                            type="date"
                            value={documentDate}
                            onChange={(e) => setDocumentDate(e.target.value)}
                            className="w-full h-12 rounded-lg border border-gray-200 bg-white px-4 text-sm focus:ring-2 focus:ring-[#FF6B00] outline-none"
                        />
                    </label>
                </div>

                <div className="bg-[#F3F4F6] rounded-xl p-4 flex gap-3 border border-gray-100 mt-5">
                    <FileText className="w-5 h-5 text-[#FF6B00] shrink-0 mt-0.5" />
                    <p className="text-xs text-[#5a4136] leading-relaxed">
                        AI checks document clarity, institution, registration
                        number, name match, and date recency. A superadmin still
                        makes the final decision.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full h-12 bg-[#FF6B00] disabled:bg-orange-300 text-white rounded-lg font-bold hover:bg-[#e66000] active:scale-95 transition-all shadow-md mt-6 flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Camera className="w-4 h-4" />
                    )}
                    <span>Submit KYC Application</span>
                </button>
            </div>
        </motion.div>
    );
}
