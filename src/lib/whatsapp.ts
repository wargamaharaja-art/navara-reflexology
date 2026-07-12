export async function sendWhatsAppNotification(phone: string, message: string) {
  // TODO: Ganti dengan API WhatsApp sungguhan (misal Fonnte, Watzap, dll)
  console.log("====================================");
  console.log(`[WhatsApp API Mock] Mengirim pesan ke ${phone}`);
  console.log(`Isi Pesan:\n${message}`);
  console.log("====================================");
  
  // Simulasi delay jaringan
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return { success: true, message: "Pesan WhatsApp berhasil dikirim (Mock)" };
}
