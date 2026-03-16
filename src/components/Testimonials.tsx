import { Card, CardContent } from "@/components/ui/card";
import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    name: "Ahmet Yılmaz",
    company: "İnşaat Firması",
    role: "Satın Alma Müdürü",
    content: "REX Lojistik ile çalışmaya başladıktan sonra malzeme tedarik süreçlerimiz çok daha düzenli hale geldi. Özellikle parsiyel yük taşımacılığında çok başarılılar.",
    rating: 5,
  },
  {
    name: "Zeynep Kaya",
    company: "E-ticaret Şirketi",
    role: "Operasyon Müdürü",
    content: "Depolama hizmetlerinde son derece profesyoneller. Avrupa sevkiyatlarımızda hiç sorun yaşamadık. Kesinlikle tavsiye ederim.",
    rating: 5,
  },
  {
    name: "Mehmet Demir",
    company: "Üretim Firması",
    role: "Lojistik Koordinatörü",
    content: "Komple kamyon tedariği ve nakliye hizmetlerinde çok memnunuz. Hem fiyat hem kalite açısından sektörün en iyilerinden biri.",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section id="referanslar" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-heading font-bold text-4xl text-navy mb-4">
            Müşterilerimiz Ne Diyor?
          </h2>
          <p className="text-muted-foreground text-lg">
            REX Lojistik ile çalışan mutlu müşterilerimizin deneyimleri
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