"use client";

import { useState } from "react";
import Link from "next/link";
import { Scale, ArrowRight, RefreshCcw } from "lucide-react";

export default function BMICalculatorPage() {
  const [weight, setWeight] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [result, setResult] = useState<{
    bmi: number;
    category: string;
    color: string;
    message: string;
  } | null>(null);

  const calculateBMI = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100; // convert cm to m

    if (w > 0 && h > 0) {
      const bmi = w / (h * h);
      let category = "";
      let color = "";
      let message = "";

      if (bmi < 18.5) {
        category = "Kekurangan Berat Badan";
        color = "text-blue-500";
        message = "Anda perlu meningkatkan asupan kalori bernutrisi. Konsultasikan dengan ahli gizi.";
      } else if (bmi >= 18.5 && bmi < 24.9) {
        category = "Normal (Ideal)";
        color = "text-green-500";
        message = "Luar biasa! Pertahankan pola makan sehat dan gaya hidup aktif Anda. Terapi bekam sangat baik untuk menjaga kebugaran.";
      } else if (bmi >= 25 && bmi < 29.9) {
        category = "Kelebihan Berat Badan";
        color = "text-yellow-500";
        message = "Waspada, Anda berisiko terkena penyakit metabolik. Mulailah rutin olahraga. Terapi bekam dapat membantu melancarkan metabolisme tubuh.";
      } else {
        category = "Obesitas";
        color = "text-red-500";
        message = "Risiko tinggi terhadap penyakit jantung dan diabetes. Segera perbaiki pola makan dan rutinkan terapi pengeluaran toksin (bekam).";
      }

      setResult({ bmi: parseFloat(bmi.toFixed(1)), category, color, message });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <Scale className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground">Kalkulator BMI</h1>
          <p className="text-foreground/60 mt-2">Ukur indeks massa tubuh Anda untuk mengetahui status kesehatan secara instan.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          {!result ? (
            <form onSubmit={calculateBMI} className="p-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Berat Badan (kg)</label>
                  <input
                    type="number"
                    required
                    min="20"
                    max="300"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-4 text-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="Contoh: 65"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tinggi Badan (cm)</label>
                  <input
                    type="number"
                    required
                    min="100"
                    max="250"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-4 text-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="Contoh: 165"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl shadow-md transition-colors text-lg mt-4"
                >
                  Hitung BMI Saya
                </button>
              </div>
            </form>
          ) : (
            <div className="p-8 text-center animate-in fade-in slide-in-from-bottom-4">
              <div className="mb-6">
                <span className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Hasil BMI Anda</span>
                <div className={`text-7xl font-black my-4 ${result.color}`}>
                  {result.bmi}
                </div>
                <div className={`inline-block px-6 py-2 rounded-full text-lg font-bold border-2 ${result.color} border-current bg-opacity-10`}>
                  {result.category}
                </div>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-2xl mb-8 border border-gray-100">
                <p className="text-gray-700 leading-relaxed">{result.message}</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setResult(null)}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <RefreshCcw className="h-5 w-5" /> Hitung Ulang
                </button>
                {(result.category === "Kelebihan Berat Badan" || result.category === "Obesitas" || result.category === "Normal (Ideal)") && (
                  <Link
                    href="/booking"
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-accent hover:bg-accent-dark transition-colors shadow-lg shadow-accent/30"
                  >
                    Reservasi Terapi Bekam <ArrowRight className="h-5 w-5" />
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
