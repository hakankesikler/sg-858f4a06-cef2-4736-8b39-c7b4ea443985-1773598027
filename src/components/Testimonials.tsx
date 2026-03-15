import { Card, CardContent } from "@/components/ui/card";
import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    name: "Ahmet Yılmaz",
    company: "ABC Tekstil",
    role: "Lojistik Müdürü",
    content: "LogisticPro ile çalışmaya başladıktan sonra teslimat sürelerimiz %40 iyileşti. Profesyonel ekip ve güvenilir hizmet.",
    rating: 5,
  },
  {
    name: "Zeynep Kaya",
    company: "XYZ E-ticaret",
    role: "Operasyon Direktörü",
    content: "Anlık takip sistemi ve müşteri desteği mükemmel. Uluslararası gönderilerimizde hiç sorun yaşamadık.",
    rating: 5,
  },
  {
    name: "Mehmet Demir",
    company: "DEF Otomotiv",
    role: "Tedarik Zinciri Yöneticisi",
    content: "15 yıldır lojistik sektöründeyim, bu kadar kaliteli hizmet ilk defa görüyorum. Kesinlikle tavsiye ederim.",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-heading font-bold text-4xl text-navy mb-4">
            Müşterilerimiz Ne Diyor?
          </h2>
          <p className="text-muted-foreground text-lg">
            Binlerce mutlu müşterimizin deneyimlerinden bazıları
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-2 hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                  ))}
                </div>
                
                <Quote className="w-8 h-8 text-primary/20 mb-3" />
                
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>
                
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-accent p-2 rounded-full w-12 h-12 flex items-center justify-center text-white font-heading font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-heading font-semibold text-navy">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role}, {testimonial.company}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}