import Button from "@/components/ui/Button";
import Universe from "@/components/universe/Universe";
import { homeGraph } from "@/data/universe";
import { profile } from "@/data/profile";

export default function Hero() {
  const { heroHeadline, heroText, focusAreas, contact } = profile;

  return (
    <section id="home" className="relative lg:min-h-[calc(100svh-4rem)]">
      {/* Large screens: the universe fills the section behind the text.
          Phones and tablets: text first, universe below it. */}
      <div className="relative z-10 lg:pointer-events-none lg:flex lg:min-h-[calc(100svh-4rem)] lg:items-center">
        <div className="container-page py-14 lg:py-8">
          <div className="lg:max-w-[34rem] lg:pointer-events-auto">
            <h1 className="max-w-4xl text-display font-semibold lg:text-[3.25rem] xl:text-[3.75rem]">
              <span className="block">{heroHeadline.first}</span>
              <span className="block text-violet">{heroHeadline.second}</span>
            </h1>

            <p className="mt-6 max-w-xl text-lead text-ink-muted">{heroText}</p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button href="/projects" internal>Explore My Work</Button>
              <Button href={contact.resume} variant="secondary">
                View Résumé
              </Button>
            </div>

            <ul
              aria-label="Focus areas"
              className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted"
            >
              {focusAreas.map((area, index) => (
                <li key={area} className="flex items-center gap-3">
                  {index > 0 && <span aria-hidden="true">·</span>}
                  {area}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="relative lg:absolute lg:inset-0 lg:z-0">
        <Universe graph={homeGraph} />
      </div>
    </section>
  );
}
