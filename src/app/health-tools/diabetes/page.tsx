"use client";

import { useState } from "react";
import Link from "next/link";
import { HeartPulse, ArrowRight, ArrowLeft, RefreshCcw } from "lucide-react";

const questions = [
  "Berapa usia Anda saat ini?",
  "Apakah Anda memiliki anggota keluarga kandung (ayah, ibu, saudara) yang mengidap diabetes?",
  "Seberapa sering Anda mengonsumsi makanan/minuman manis dalam sehari?",
  "Apakah Anda rutin berolahraga (minimal 30 menit, 3x seminggu)?",
  "Berdasarkan BMI Anda, apakah Anda tergolong kelebihan berat badan (Obesitas)?",
];

const optionsData = [
  [
    { label: "Di bawah 35 tahun", score: 0 },
    { label: "35 - 45 tahun", score: 1 },
    { label: "Di atas 45 tahun", score: 2 },
  ],
  [
    { label: "Tidak", score: 0 },
    { label: "Ya", score: 3 },
  ],
  [
    { label: "Jarang (1x seminggu)", score: 0 },
    { label: "1-2 kali sehari", score: 1 },
    { label: "Lebih dari 3 kali sehari", score: 3 },
  ],
  [
    { label: "Ya, rutin", score: 0 },
    { label: "Tidak / Jarang", score: 2 },
  ],
  [
    { label: "Tidak", score: 0 },
    { label: "Ya", score: 2 },
  ],
];

export default function DiabetesRiskPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState<number[]>(Array(questions.length).fill(-1));
  const [isFinished, setIsFinished] = useState(false);

  const handleAnswer = (score: number) => {
    const newScores = [...scores];
    newScores[currentQuestion] = score;
    setScores(newScores);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setIsFinished(true);
    }
  };

  const getResult = () => {
    const totalScore = scores.reduce((a, b) => a + b, 0);

    if (totalScore <= 3) {
      return {
        level: "Risiko Rendah",
        color: "text-green-500",
        message: "Kabar baik! Gaya hidup Anda cukup sehat. Tetap jaga pola makan gizi seimbang dan rutinkan olahraga.",
      };
    } else if (totalScore <= 7) {
      return {
        level: "Risiko Sedang",
        color: "text-yellow-500",
        message: "Anda memiliki beberapa faktor risiko. Mulailah kurangi asupan gula harian dan perbanyak gerak fisik. Terapi detoksifikasi seperti bekam sangat disarankan.",
      };
    } else {
      return {
        level: "Risiko Tinggi",
        color: "text-red-500",
        message: "Peringatan! Anda sangat berisiko terkena diabetes tipe 2. Sangat disarankan untuk memeriksakan gula darah Anda ke dokter. Terapkan diet ketat gula dan rutinkan terapi bekam sunnah untuk melancarkan sirkulasi darah.",
      };
    }
  };

  const progress = ((currentQuestion + (isFinished ? 1 : 0)) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <HeartPulse className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground">Kalkulator Risiko Diabetes</h1>
          <p className="text-foreground/60 mt-2">Deteksi dini risiko diabetes berdasarkan gaya hidup dan riwayat keluarga Anda.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          <div className="w-full bg-gray-100 h-2">
            <div 
              className="bg-red-500 h-2 transition-all duration-500 ease-out" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {!isFinished ? (
            <div className="p-8">
              <span className="text-red-500 font-bold text-sm tracking-wider uppercase mb-2 block">
                Pertanyaan {currentQuestion + 1} dari {questions.length}
              </span>
              <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-8 min-h-[5rem]">
                {questions[currentQuestion]}
              </h2>

              <div className="space-y-3">
                {optionsData[currentQuestion].map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(opt.score)}
                    className="w-full text-left p-4 rounded-xl border-2 border-gray-100 hover:border-red-500 hover:bg-red-50 transition-all font-medium text-gray-700"
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
                    <h2 className="text-xl font-bold text-gray-800 mb-6">Hasil Estimasi Risiko</h2>
                    
                    <div className="mb-8">
                      <div className={`text-4xl font-black mt-4 ${res.color}`}>{res.level}</div>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-2xl mb-8 border border-gray-100">
                      <p className="text-gray-700 leading-relaxed">{res.message}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <button
                        onClick={() => {
                          setCurrentQuestion(0);
                          setScores(Array(questions.length).fill(-1));
                          setIsFinished(false);
                        }}
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                      >
                        <RefreshCcw className="h-5 w-5" /> Cek Ulang
                      </button>
                      {(res.level === "Risiko Sedang" || res.level === "Risiko Tinggi") && (
                        <Link
                          href="/booking"
                          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-lg shadow-red-600/30"
                        >
                          Booking Bekam Detoks <ArrowRight className="h-5 w-5" />
                        </Link>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-6">*Catatan: Kalkulator ini hanya untuk estimasi awal dan tidak menggantikan diagnosis medis profesional.</p>
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
