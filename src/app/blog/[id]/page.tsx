import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, User, Tag, Clock, ArrowRight } from "lucide-react";

type Article = {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  imageUrl: string;
  content: string;
};

const articles: Article[] = [
  {
    id: "manfaat-bekam-untuk-darah-tinggi",
    title: "5 Manfaat Terapi Bekam untuk Penderita Darah Tinggi",
    excerpt: "Hipertensi atau darah tinggi dapat memicu berbagai komplikasi mematikan. Ketahui bagaimana terapi bekam sunnah dapat membantu menstabilkan tekanan darah Anda.",
    category: "Kesehatan Islami",
    author: "Dr. Ahmad",
    date: "10 Juni 2026",
    readTime: "5 menit",
    imageUrl: "/images/blog/hipertensi.png",
    content: `
Hipertensi atau tekanan darah tinggi adalah kondisi yang diderita oleh jutaan orang di seluruh dunia. Jika tidak ditangani dengan baik, kondisi ini bisa memicu komplikasi serius seperti serangan jantung dan stroke. Di samping pengobatan medis konvensional, terapi bekam — sebuah pengobatan yang bersumber dari sunnah Nabi Muhammad SAW — telah terbukti memberikan manfaat nyata bagi penderita hipertensi.

## 1. Melancarkan Sirkulasi Darah

Mekanisme utama bekam adalah menciptakan tekanan negatif pada permukaan kulit menggunakan cup (wadah). Tekanan ini menarik lapisan jaringan di bawah kulit, merangsang sirkulasi darah pada area tersebut. Aliran darah yang lebih lancar membantu mengurangi beban kerja jantung dalam memompa darah ke seluruh tubuh, sehingga secara bertahap dapat menurunkan tekanan darah.

## 2. Membuang Darah Stasis (Darah Kental/Kotor)

Dalam konsep kedokteran bekam, terdapat istilah "darah stasis" yaitu darah yang mengendap dan kurang mengalir optimal di jaringan kapiler tertentu. Darah yang kental dan mengalami stasis memiliki viskositas (kekentalan) yang tinggi, yang merupakan salah satu faktor risiko hipertensi. Bekam basah (Al-Hijamah) yang melibatkan sayatan kecil pada kulit bertujuan untuk mengeluarkan darah stasis ini, sehingga kualitas darah yang beredar menjadi lebih baik.

## 3. Merangsang Titik Akupresur

Bekam kering sering kali dilakukan pada titik-titik tertentu yang berkaitan dengan meridian energi dalam tubuh — konsep yang mirip dengan akupunktur. Stimulasi pada titik-titik ini dipercaya dapat membantu mengatur tekanan darah, meredakan ketegangan otot, dan meningkatkan respons sistem saraf otonom yang berperan dalam regulasi kardiovaskular.

## 4. Menurunkan Kadar Kolesterol & Asam Urat

Penelitian ilmiah modern mulai mengungkap bahwa bekam dapat membantu menurunkan kadar kolesterol LDL (kolesterol jahat) dan trigliserida dalam darah. Kolesterol tinggi adalah faktor utama pembentukan plak di dinding pembuluh darah (aterosklerosis), yang pada akhirnya menyempitkan pembuluh dan meningkatkan tekanan darah. Dengan mengurangi kadar kolesterol, bekam turut berperan dalam manajemen hipertensi.

## 5. Efek Relaksasi & Pengurangan Stres

Stres kronis adalah pemicu tekanan darah tinggi yang sering diabaikan. Sesi bekam, terutama yang didahului dengan pijatan relaksasi, terbukti merangsang pelepasan endorfin — hormon alami pereda nyeri dan penciptaan rasa nyaman. Banyak pasien melaporkan rasa rileks mendalam dan tidur berkualitas setelah sesi bekam. Relaksasi ini secara langsung membantu menurunkan hormon kortisol (hormon stres) yang jika berlebihan dapat meningkatkan tekanan darah.

## Catatan Penting

Terapi bekam untuk hipertensi harus dilakukan oleh terapis yang terlatih dan bersertifikat. Jangan menghentikan konsumsi obat-obatan medis yang diresepkan dokter tanpa berkonsultasi terlebih dahulu. Bekam berfungsi sebagai **terapi komplementer** — pelengkap — bukan pengganti pengobatan medis utama.

Jika Anda atau keluarga menderita hipertensi dan ingin mencoba manfaat bekam, konsultasikan kondisi Anda dengan terapis kami di Navara Reflexology untuk mendapatkan program terapi yang tepat dan aman.
    `.trim(),
  },
  {
    id: "titik-refleksi-kaki",
    title: "Pijat Refleksi Kaki: Titik Saraf Mana Saja yang Ditekan?",
    excerpt: "Sering merasa lelah setelah bekerja seharian? Pelajari titik-titik pijat refleksi pada telapak kaki yang terhubung langsung dengan organ tubuh vital.",
    category: "Tips Sehat",
    author: "Terapis Budi",
    date: "5 Juni 2026",
    readTime: "6 menit",
    imageUrl: "/images/blog/insomnia.png",
    content: `
Pernahkah Anda merasa seluruh tubuh terasa jauh lebih baik setelah kaki dipijat? Ini bukan sekadar kebetulan. Pijat refleksi kaki (foot reflexology) didasarkan pada prinsip bahwa telapak kaki adalah "peta mini" seluruh tubuh manusia. Setiap zona dan titik pada telapak kaki secara langsung terhubung — melalui jalur saraf dan meridian energi — dengan organ-organ vital di dalam tubuh.

## Bagaimana Refleksiologi Bekerja?

Menurut teori refleksiologi, terdapat lebih dari 7.000 ujung saraf pada setiap telapak kaki yang terhubung ke organ, kelenjar, dan sistem tubuh lainnya. Dengan memberikan tekanan yang tepat pada titik-titik tertentu, terapis dapat membantu merangsang aliran energi, melancarkan peredaran darah, dan mendukung fungsi organ yang bersangkutan.

## Peta Titik Refleksi Utama pada Telapak Kaki

### Ujung Jari Kaki
- **Ibu Jari (Jempol):** Terhubung ke otak, kepala, dan hipofisis (kelenjar pituitari). Tekanan di sini bermanfaat untuk sakit kepala, migrain, dan gangguan tidur.
- **Jari Kedua & Ketiga:** Berkaitan dengan sinus dan mata. Sering ditekan untuk meredakan hidung tersumbat dan mata lelah.
- **Jari Keempat & Kelingking:** Berhubungan dengan telinga. Stimulasi di sini membantu masalah pendengaran dan vertigo.

### Bagian Atas Telapak Kaki (Bola Kaki)
- **Zona Paru-Paru & Dada:** Terletak di bagian atas telapak, tepat di bawah jari-jari. Menekan zona ini bermanfaat untuk sesak napas, asma, dan kesehatan pernapasan secara umum.
- **Titik Jantung:** Berada di bola kaki sebelah kiri. Tekanan lembut di sini dapat membantu menenangkan jantung yang berdebar.

### Bagian Tengah Telapak (Lengkungan Kaki)
- **Titik Hati:** Di telapak kaki kanan, area ini berkaitan dengan fungsi hati dan kandung empedu.
- **Titik Lambung & Pankreas:** Di tengah lengkungan kedua kaki. Berguna untuk masalah pencernaan, mual, dan kembung.
- **Titik Ginjal:** Tepat di tengah telapak kaki, ini adalah titik yang sangat penting. Menekan titik ginjal membantu detoksifikasi tubuh dan menjaga energi vital.
- **Titik Usus Kecil & Usus Besar:** Mengisi sebagian besar area tengah dan bawah telapak. Stimulasi di sini membantu melancarkan pencernaan dan mengatasi sembelit.

### Tumit Kaki
- **Titik Panggul & Tulang Belakang Bawah:** Area tumit berkaitan dengan punggung bawah, panggul, dan tulang ekor. Bagi yang sering nyeri pinggang atau pegal setelah duduk lama, stimulasi area tumit sangat direkomendasikan.
- **Titik Sciatic (Saraf Isiatik):** Terdapat garis yang melintasi tumit, berhubungan dengan saraf isiatik yang panjangnya dari punggung bawah hingga ujung kaki.

## Manfaat yang Bisa Dirasakan

- ✅ Mengurangi rasa lelah dan meningkatkan vitalitas
- ✅ Memperbaiki kualitas tidur (mengatasi insomnia)
- ✅ Meredakan nyeri kepala dan punggung
- ✅ Meningkatkan imunitas tubuh
- ✅ Mengurangi stres dan kecemasan
- ✅ Melancarkan pencernaan

## Tips Melakukan Pijat Refleksi di Rumah

1. Rendam kaki dalam air hangat selama 10 menit sebelum memulai.
2. Gunakan minyak esensial atau krim pijat agar lebih nyaman.
3. Berikan tekanan menggunakan ibu jari dengan gerakan memutar selama 5-10 detik di setiap titik.
4. Lakukan selama 20-30 menit, bergantian pada kedua kaki.

Untuk hasil yang optimal dan penanganan kondisi kesehatan tertentu, selalu percayakan pada terapis refleksi profesional dan bersertifikat seperti yang ada di Navara Reflexology.
    `.trim(),
  },
  {
    id: "mitos-dan-fakta-bekam",
    title: "Mitos & Fakta Seputar Bekam yang Wajib Anda Tahu",
    excerpt: "Apakah bekam itu sakit? Benarkah bekam bisa menyembuhkan segala penyakit? Mari kita kupas tuntas mitos dan fakta seputar terapi pengobatan sunnah ini.",
    category: "Edukasi",
    author: "Tim Navara Reflexology",
    date: "1 Juni 2026",
    readTime: "7 menit",
    imageUrl: "/images/blog/edukasi.png",
    content: `
Bekam (Al-Hijamah) adalah salah satu metode pengobatan tertua di dunia yang berasal dari tradisi Arab kuno dan disempurnakan oleh sunnah Nabi Muhammad SAW. Meski popularitasnya terus meningkat, masih banyak kesalahpahaman yang beredar di masyarakat tentang terapi ini. Mari kita luruskan bersama.

## ❌ Mitos 1: "Bekam Itu Sangat Sakit dan Menyiksa"

**✅ Fakta:** Sebagian besar pasien yang baru pertama kali mencoba bekam terkejut karena ternyata prosesnya tidak sepainful yang dibayangkan. Sensasi yang dirasakan selama bekam kering umumnya adalah rasa tarikan atau tekanan ringan — mirip seperti dipijat kuat. Untuk bekam basah, sayatan yang dibuat sangat kecil dan dangkal (hanya kulit terluar), dan dilakukan setelah area tersebut sudah terasa mati rasa akibat efek bekam kering sebelumnya. Tingkat rasa tidak nyaman sangat bervariasi antar individu dan bergantung pada keahlian terapis.

## ❌ Mitos 2: "Bekam Bisa Menyembuhkan Semua Penyakit"

**✅ Fakta:** Ini adalah klaim yang berlebihan dan tidak bertanggung jawab. Dalam hadis, Nabi SAW menyebutkan bekam sebagai salah satu pengobatan terbaik, namun ini tidak berarti bekam adalah obat untuk segala penyakit. Bekam adalah **terapi komplementer** yang bekerja paling baik jika dikombinasikan dengan gaya hidup sehat, diet seimbang, dan pengobatan medis yang diperlukan. Bekam memiliki indikasi dan kontraindikasi tertentu. Ada kondisi di mana bekam TIDAK boleh dilakukan, seperti pada penderita hemofilia, trombositopenia berat, atau wanita hamil pada trimester tertentu.

## ❌ Mitos 3: "Bekas Bulatan Merah Setelah Bekam adalah Memar Berbahaya"

**✅ Fakta:** Bekas lingkaran (petechiae atau ecchymosis) yang muncul setelah bekam kering bukan memar biasa. Memar konvensional terjadi akibat trauma fisik yang merusak pembuluh darah. Bekas bekam terbentuk karena tekanan negatif cup menarik darah yang sudah berada di jaringan kapiler permukaan kulit naik ke permukaan. Darah yang tampak sebagai warna ungu-merah ini adalah bagian normal dari proses dan akan menghilang sendiri dalam 3-7 hari. Warna gelap sering dikaitkan oleh praktisi bekam dengan tingkat "toksisitas" atau "stasis" darah pada area tersebut — meski klaim ini masih terus diteliti secara ilmiah.

## ❌ Mitos 4: "Bekam Hanya Boleh Dilakukan di Punggung"

**✅ Fakta:** Meski punggung (terutama area sela-sela tulang belikat/Kahil — titik yang paling dianjurkan dalam sunnah) adalah lokasi yang paling umum, bekam dapat dilakukan di banyak titik lain di tubuh. Beberapa lokasi umum lainnya meliputi: leher dan bahu (untuk sakit kepala & nyeri bahu), betis (untuk kelelahan kaki), perut (untuk masalah pencernaan), dan paha/lutut (untuk nyeri sendi). Pemilihan titik bekam bergantung pada keluhan dan kondisi kesehatan masing-masing individu.

## ❌ Mitos 5: "Siapa Saja Bisa Melakukan Bekam Sendiri di Rumah dengan Alat DIY"

**✅ Fakta:** Ini adalah mitos yang **berpotensi berbahaya**. Bekam, terutama bekam basah, adalah prosedur yang memerlukan keahlian medis dan kondisi yang steril. Melakukan bekam basah tanpa pelatihan yang memadai dapat menyebabkan infeksi serius, perdarahan berlebihan, atau kerusakan saraf. Bahkan bekam kering yang tampaknya sederhana dapat memberikan efek yang tidak diinginkan jika dilakukan dengan teknik yang salah atau pada titik yang tidak tepat. Selalu lakukan bekam bersama terapis yang **terlatih, bersertifikat, dan menggunakan peralatan steril**.

## Kesimpulan

Bekam adalah terapi yang memiliki dasar ilmiah dan manfaat yang nyata jika dilakukan dengan benar oleh tenaga ahli yang kompeten. Jangan biarkan mitos menghalangi Anda dari mendapatkan manfaatnya, namun juga jangan mudah percaya dengan klaim-klaim yang berlebihan.

Di Navara Reflexology, setiap sesi bekam ditangani oleh terapis bersertifikat dengan standar higienitas dan keamanan yang ketat. Konsultasikan kondisi kesehatan Anda sebelum memulai terapi.
    `.trim(),
  },
];

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = articles.find((a) => a.id === id);
  if (!article) return { title: "Artikel Tidak Ditemukan" };
  return {
    title: `${article.title} - Navara Reflexology`,
    description: article.excerpt,
  };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = articles.find((a) => a.id === id);

  if (!article) notFound();

  const otherArticles = articles.filter((a) => a.id !== id);

  // Convert markdown-like content to paragraphs with headings
  const renderContent = (content: string) => {
    const lines = content.split("\n");
    const elements: React.ReactNode[] = [];
    let key = 0;

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        elements.push(<div key={key++} className="h-2" />);
      } else if (trimmed.startsWith("## ")) {
        elements.push(
          <h2 key={key++} className="text-2xl font-bold text-slate-900 mt-10 mb-4 pb-2 border-b border-gray-100">
            {trimmed.replace("## ", "")}
          </h2>
        );
      } else if (trimmed.startsWith("### ")) {
        elements.push(
          <h3 key={key++} className="text-lg font-bold text-slate-800 mt-6 mb-3">
            {trimmed.replace("### ", "")}
          </h3>
        );
      } else if (trimmed.startsWith("- ")) {
        const text = trimmed.replace(/^- /, "");
        const parts = text.split(/\*\*(.*?)\*\*/g);
        elements.push(
          <li key={key++} className="flex items-start gap-3 text-slate-700 leading-relaxed">
            <span className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />
            <span>
              {parts.map((p, i) =>
                i % 2 === 1 ? <strong key={i} className="font-bold text-slate-900">{p}</strong> : p
              )}
            </span>
          </li>
        );
      } else if (trimmed.startsWith("✅ ") || trimmed.startsWith("- ✅")) {
        const text = trimmed.replace(/^- ?✅ /, "");
        elements.push(
          <li key={key++} className="flex items-center gap-3 text-slate-700">
            <span className="text-emerald-500 text-lg">✅</span>
            <span>{text}</span>
          </li>
        );
      } else if (/^\d+\./.test(trimmed)) {
        const text = trimmed.replace(/^\d+\.\s/, "");
        const parts = text.split(/\*\*(.*?)\*\*/g);
        elements.push(
          <li key={key++} className="text-slate-700 leading-relaxed list-decimal ml-5">
            {parts.map((p, i) =>
              i % 2 === 1 ? <strong key={i} className="font-bold text-slate-900">{p}</strong> : p
            )}
          </li>
        );
      } else if (trimmed.startsWith("❌ Mitos") || trimmed.startsWith("**✅ Fakta:**")) {
        const isMyth = trimmed.startsWith("❌");
        const text = trimmed.replace(/^[❌✅]\s?(Mitos\s\d+:\s?)?/, "").replace(/^\*\*✅ Fakta:\*\*\s?/, "");
        elements.push(
          <div key={key++} className={`flex items-start gap-3 p-4 rounded-xl mb-2 ${isMyth ? "bg-red-50 border border-red-100" : "bg-emerald-50 border border-emerald-100"}`}>
            <span className="text-2xl shrink-0">{isMyth ? "❌" : "✅"}</span>
            <p className={`font-semibold ${isMyth ? "text-red-800" : "text-emerald-800"}`}>
              {isMyth ? `Mitos: "${text.replace(/^"/, "").replace(/"$/, "")}"` : `Fakta: ${text}`}
            </p>
          </div>
        );
      } else {
        // Regular paragraph — handle **bold** inline
        const parts = trimmed.split(/\*\*(.*?)\*\*/g);
        elements.push(
          <p key={key++} className="text-slate-700 leading-relaxed text-[17px]">
            {parts.map((p, i) =>
              i % 2 === 1 ? <strong key={i} className="font-bold text-slate-900">{p}</strong> : p
            )}
          </p>
        );
      }
    });

    return elements;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Hero Image */}
      <div className="relative w-full h-[45vh] md:h-[55vh] overflow-hidden bg-slate-900">
        <Image
          src={article.imageUrl}
          alt={article.title}
          fill
          className="object-cover opacity-60"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />

        {/* Back Button */}
        <div className="absolute top-6 left-6 z-10">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke Blog
          </Link>
        </div>

        {/* Category Badge */}
        <div className="absolute bottom-8 left-0 right-0 px-6 md:px-0">
          <div className="max-w-3xl mx-auto">
            <span className="inline-block bg-accent text-white text-xs font-bold px-4 py-1.5 rounded-full tracking-wider uppercase mb-4">
              {article.category}
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight max-w-3xl">
              {article.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-5 text-sm text-slate-500 mb-10 pb-6 border-b border-gray-200">
          <span className="flex items-center gap-2 font-semibold">
            <User className="h-4 w-4 text-primary" />
            {article.author}
          </span>
          <span className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            {article.date}
          </span>
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            {article.readTime} baca
          </span>
          <span className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" />
            {article.category}
          </span>
        </div>

        {/* Lead Paragraph */}
        <p className="text-xl text-slate-600 leading-relaxed font-medium mb-8 italic border-l-4 border-primary pl-5">
          {article.excerpt}
        </p>

        {/* Article Body */}
        <div className="space-y-4">
          {renderContent(article.content)}
        </div>

        {/* CTA */}
        <div className="mt-16 bg-gradient-to-br from-primary to-emerald-800 rounded-3xl p-8 text-center text-white">
          <h3 className="text-2xl font-black mb-3">Ingin Mencoba Terapi Bekam?</h3>
          <p className="text-white/80 mb-6 max-w-md mx-auto">
            Tim terapis profesional kami siap membantu. Reservasi sekarang dan dapatkan konsultasi gratis sebelum sesi pertama Anda.
          </p>
          <Link
            href="/booking"
            className="inline-flex items-center gap-2 bg-white text-primary font-bold px-8 py-3 rounded-xl hover:bg-amber-50 transition-colors shadow-lg"
          >
            Reservasi Sekarang <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Related Articles */}
      {otherArticles.length > 0 && (
        <div className="bg-white border-t border-gray-100 py-16">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-2xl font-black text-slate-900 mb-8">Artikel Terkait</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {otherArticles.map((other) => (
                <Link
                  key={other.id}
                  href={`/blog/${other.id}`}
                  className="group flex gap-4 bg-[#f8fafc] hover:bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-md transition-all"
                >
                  <div className="relative w-28 h-24 shrink-0 rounded-xl overflow-hidden">
                    <Image src={other.imageUrl} alt={other.title} fill className="object-cover" />
                  </div>
                  <div className="flex flex-col justify-between py-1">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">{other.category}</span>
                    <p className="text-sm font-bold text-slate-800 group-hover:text-primary transition-colors leading-snug line-clamp-2">
                      {other.title}
                    </p>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {other.date}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
