import Link from "next/link";
import { AlertTriangle, Home } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
        <AlertTriangle className="w-12 h-12 text-red-600" />
      </div>
      
      <h1 className="text-4xl font-bold text-gray-900 mb-2">403 Akses Ditolak</h1>
      <p className="text-lg text-gray-600 max-w-md mb-8">
        Maaf, Anda tidak memiliki izin yang diperlukan untuk mengakses halaman ini. Hubungi administrator jika Anda merasa ini adalah sebuah kesalahan.
      </p>

      <Link href="/admin" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
        <Home className="w-5 h-5 mr-2" />
        Kembali ke Dashboard
      </Link>
    </div>
  );
}
