"use client";

import { useState } from "react";
import Link from "next/link";
import { BrainCircuit, ArrowRight, ArrowLeft, RefreshCcw } from "lucide-react";

const questions = [
  "Seberapa sering Anda merasa lelah atau kehabisan energi meskipun sudah tidur cukup?",
  "Apakah Anda sering mengalami ketegangan otot di leher, pundak, atau punggung?",
  "Seberapa sering Anda merasa kesulitan untuk berkonsentrasi atau mudah lupa akhir-akhir ini?",
  "Apakah Anda mudah merasa tersinggung, marah, atau gelisah karena hal sepele?",
  "Seberapa sering Anda merasa kewalahan dengan tanggung jawab atau pekerjaan Anda?",
];

const options = [
  { label: "Tidak Pernah", value: 0 },
  { label: "Jarang", value: 1 },
  { label: "Kadang-kadang", value: 2 },
  { label: "Sering", value: 3 },
];

export default function StressMeterPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>(Array(questions.length).fill(-1));
  const [isFinished, setIsFinished] = useState(false);

  const handleAnswer = (value: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = value;
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setIsFinished(true);
    }
  };

  const getResult = () => {
    const totalScore = answers.reduce((a, b) => a + b, 0);
    const maxScore = questions.length * 3;
    const percentage = (totalScore / maxScore) * 100;

    if (percentage < 25) {
      return {
        level: "Rendah",
        color: "text-green-500",
        barColor: "bg-green-500",
        message: "Stres Anda terkendali dengan baik. Pertahankan pola hidup seimbang Anda!",
      };
    } else if (percentage < 60) {
      return {
        level: "Sedang",
        color: "text-yellow-500",
        barColor: "bg-yellow-500",
        message: "Anda mengalami tingkat stres moderat. Tubuh Anda mungkin mulai memberi sinyal peringatan berupa pegal-pegal atau sulit tidur. Luangkan waktu untuk relaksasi.",
      };
    } else {
      return {
        level: "Tinggi",
        color: "text-red-500",
        barColor: "bg-red-500",
        message: "Tingkat stres Anda cukup membahayakan. Ini bisa memicu darah tinggi, gangguan hormon, dan depresi. Anda sangat butuh terapi relaksasi fisik dan mental segera.",
      };
    }
  };

  const progress = ((currentQuestion + (isFinished ? 1 : 0)) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <BrainCircuit className="h-12 w-12 text-accent mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground">Cek Stres Meter</h1>
          <p className="text-foreground/60 mt-2">Jawab 5 pertanyaan singkat ini untuk mengetahui tingkat kelelahan mental Anda.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          {/* Progress Bar */}
          <div className="w-full bg-gray-100 h-2">
            <div 
              className="bg-accent h-2 transition-all duration-500 ease-out" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {!isFinished ? (
            <div className="p-8">
              <span className="text-accent font-bold text-sm tracking-wider uppercase mb-2 block">
                Pertanyaan {currentQuestion + 1} dari {questions.length}
              </span>
              <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-8 min-h-[5rem]">
                "{questions[currentQuestion]}"
              </h2>

              <div className="space-y-3">
                {options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleAnswer(opt.value)}
                    className="w-full text-left p-4 rounded-xl border-2 border-gray-100 hover:border-accent hover:bg-accent/5 transition-all font-medium text-gray-700"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {currentQuestion > 0 && (
                <button
                  onClick={() => setCurrentQuestion(currentQuestion - 1)}
                  className="mt-8 text-sm font-semibold text-gray-400 hover:text-gray-600 flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" /> Sebelumnya
                </button>
              )}
            </div>
          ) : (
            <div className="p-8 text-center animate-in fade-in slide-in-from-bottom-4">
              {(() => {
                const res = getResult();
                return (
                  <>
                    <h2 className="text-xl font-bold text-gray-800 mb-6">Hasil Analisis Anda</h2>
                    
                    <div className="mb-8 relative max-w-xs mx-auto">
                      <div className="h-4 bg-gray-100 rounded-full overflow-hidden flex">
                        <div className={`h-full ${res.barColor} transition-all duration-1000`} style={{ width: '100%' }}></div>
                      </div>
                      <div className={`text-4xl font-black mt-4 ${res.color}`}>{res.level}</div>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-2xl mb-8 border border-gray-100">
                      <p className="text-gray-700 leading-relaxed">{res.message}</p>
                    </div>

                    <div className="flex flex-col gap-4">
                      {(res.level === "Sedang" || res.level === "Tinggi") && (
                        <div className="bg-accent/10 border border-accent p-4 rounded-xl mb-4 text-left">
                          <h4 className="font-bold text-accent-dark mb-1">Rekomendasi Terapi:</h4>
                          <p className="text-sm text-gray-700">Kami merekomendasikan layanan <strong>Pijat Refleksi</strong> atau <strong>Paket Sehat</strong> untuk mengendurkan otot tegang dan memulihkan energi.</p>
                          <Link
                            href="/booking"
                            className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-white bg-accent hover:bg-accent-dark transition-colors shadow-lg shadow-accent/30"
                          >
                            Reservasi Sekarang <ArrowRight className="h-5 w-5" />
                          </Link>
                        </div>
                      )}

                      <button
                        onClick={() => {
                          setCurrentQuestion(0);
                          setAnswers(Array(questions.length).fill(-1));
                          setIsFinished(false);
                        }}
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                      >
                        <RefreshCcw className="h-5 w-5" /> Ulangi Tes
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
