import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { Star, Quote, CheckCircle } from "lucide-react";

const testimonials = [
  {
    name: "Dr. Michael Schneider",
    role: "Geschäftsführer, Schneider GmbH",
    text: "Kanzlei Bergmann hat unsere Unternehmensrestrukturierung mit beeindruckender Expertise begleitet. Die strategische Beratung war erstklassig – wir konnten über 2,3 Mio. Euro sichern.",
    rating: 5,
    image: "https://randomuser.me/api/portraits/men/42.jpg",
    caseType: "Unternehmensrecht",
    verified: true,
    date: "vor 2 Wochen",
  },
  {
    name: "Sarah Keller",
    role: "Marketing Direktorin",
    text: "Nach meiner Kündigung fühlte ich mich hilflos. Herr Bergmann hat nicht nur eine faire Abfindung von 85.000€ verhandelt, sondern mir auch menschlich Halt gegeben. Absolute Empfehlung.",
    rating: 5,
    image: "https://randomuser.me/api/portraits/women/65.jpg",
    caseType: "Arbeitsrecht",
    verified: true,
    date: "vor 1 Monat",
  },
  {
    name: "Thomas Braun",
    role: "Unternehmer",
    text: "Die Erbschaftsangelegenheit unserer Familie war komplex und emotional. Frau Dr. Weber hat mit Fingerspitzengefühl eine Lösung gefunden, die alle Seiten zufriedenstellt. Wirklich außergewöhnlich.",
    rating: 5,
    image: "https://randomuser.me/api/portraits/men/55.jpg",
    caseType: "Erbrecht",
    verified: true,
    date: "vor 3 Wochen",
  },
  {
    name: "Anna-Lena Fischer",
    role: "Ärztin, Praxisinhaberin",
    text: "Bei meinem Mietrechtsstreit ging es um meine Praxisräume – meine Existenz. Kanzlei Bergmann hat vor Gericht alles gegeben und gewonnen. Professionell, schnell, souverän.",
    rating: 5,
    image: "https://randomuser.me/api/portraits/women/44.jpg",
    caseType: "Immobilienrecht",
    verified: true,
    date: "vor 5 Tagen",
  },
];

const TestimonialsSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="py-32 bg-navy-dark relative overflow-hidden">
      <div className="absolute top-1/3 left-0 w-[500px] h-[500px] bg-accent/[0.04] rounded-full blur-[150px]" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/[0.03] rounded-full blur-[120px]" />

      <div className="container mx-auto px-6" ref={ref}>
        <div className="text-center mb-20">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-accent mb-4">
            <span className="w-8 h-px bg-accent/50" />
            Mandantenstimmen
            <span className="w-8 h-px bg-accent/50" />
          </span>
          <h2 className="text-4xl md:text-6xl font-display font-bold text-primary-foreground mt-3 mb-5">
            Was unsere <span className="text-gradient-gold">Mandanten</span> sagen
          </h2>
          <p className="text-primary-foreground/40 max-w-2xl mx-auto text-lg font-light">
            Über 5.000 zufriedene Mandanten vertrauen auf unsere Expertise.
          </p>
        </div>

        {/* Google rating badge */}
        <div className={`flex justify-center mb-16 ${isVisible ? "animate-blur-in" : "opacity-0"}`}>
          <div className="glass-dark px-8 py-4 flex items-center gap-5">
            <img src="https://www.google.com/favicon.ico" alt="Google" className="h-5 w-5" />
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-accent text-accent" />
              ))}
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div>
              <span className="text-2xl font-display font-bold text-primary-foreground">4.9</span>
              <span className="text-sm text-primary-foreground/40 ml-1">/ 5.0</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <span className="text-sm text-primary-foreground/50">247 Bewertungen</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              className={`group glass-dark p-8 hover:border-accent/20 transition-all duration-500 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${i * 150}ms`, transitionDuration: "800ms" }}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <img
                    src={t.image}
                    alt={t.name}
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-accent/10"
                    loading="lazy"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-primary-foreground">{t.name}</h4>
                      {t.verified && (
                        <CheckCircle className="h-3.5 w-3.5 text-green-400" />
                      )}
                    </div>
                    <p className="text-xs text-primary-foreground/40">{t.role}</p>
                    <p className="text-[10px] text-primary-foreground/25 mt-0.5">{t.date}</p>
                  </div>
                </div>
                <Quote className="h-8 w-8 text-accent/20 group-hover:text-accent/40 transition-colors" />
              </div>

              <p className="text-sm text-primary-foreground/60 leading-relaxed mb-6">„{t.text}"</p>

              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="h-3.5 w-3.5 fill-accent text-accent" />
                  ))}
                </div>
                <span className="text-[11px] uppercase tracking-wider text-accent/60 font-medium">{t.caseType}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
