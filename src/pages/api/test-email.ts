import type { NextApiRequest, NextApiResponse } from "next";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("🔑 API Key exists:", !!process.env.RESEND_API_KEY);
    console.log("🔑 API Key prefix:", process.env.RESEND_API_KEY?.substring(0, 10));

    const { data, error } = await resend.emails.send({
      from: "REX Lojistik <onboarding@resend.dev>",
      to: ["hakankesikler@gmail.com"],
      subject: "Test Email - Resend API Testi",
      text: "Bu bir test emailidir. Eğer bu emaili aldıysanız, Resend API çalışıyor demektir!",
    });

    if (error) {
      console.error("❌ Resend Error:", error);
      return res.status(400).json({ 
        success: false, 
        error: error,
        message: "Resend API hatası"
      });
    }

    console.log("✅ Email sent successfully:", data);
    return res.status(200).json({ 
      success: true, 
      data: data,
      message: "Test email başarıyla gönderildi!"
    });

  } catch (error: any) {
    console.error("❌ Catch Error:", error);
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      message: "Sunucu hatası"
    });
  }
}