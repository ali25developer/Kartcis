import { SponsorBanner } from "./SponsorBanner";

interface Sponsor {
  id: string;
  image: string;
  name: string;
  link?: string;
}

interface SponsorSectionProps {
  title?: string;
  sponsors?: Sponsor[];
  variant?: "horizontal" | "square" | "wide";
}

export function SponsorSection({
  title = "Partner Kami",
  sponsors = [],
  variant = "square",
}: SponsorSectionProps) {
  if (!sponsors || sponsors.length === 0) return null;

  return (
    <section className="py-8 bg-gray-50 border-y">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <span className="text-sm text-gray-500">
            {sponsors.length} Partner
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {sponsors.map((sponsor) => (
            <div key={sponsor.id} className="relative group">
              <div className="bg-white rounded-lg border p-4 hover:shadow-md transition-all cursor-pointer h-24 flex items-center justify-center">
                {sponsor.link ? (
                  <a
                    href={sponsor.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-full flex items-center justify-center"
                  >
                    <img
                      src={sponsor.image}
                      alt={sponsor.name}
                      className="max-w-full max-h-full object-contain grayscale group-hover:grayscale-0 transition-all"
                    />
                  </a>
                ) : (
                  <img
                    src={sponsor.image}
                    alt={sponsor.name}
                    className="max-w-full max-h-full object-contain grayscale group-hover:grayscale-0 transition-all"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}