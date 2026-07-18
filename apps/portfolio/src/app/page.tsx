import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Projects } from "@/components/Projects";
import { WorkExperience } from "@/components/WorkExperience";
import { Skills } from "@/components/Skills";
import { Education } from "@/components/Education";
import { Contact } from "@/components/Contact";
import { SiteFooter } from "@/components/SiteFooter";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main id="main-content">
        <Hero />
        <About />
        <Projects />
        <WorkExperience />
        <section id="skills" className="border-t border-border bg-secondary/40">
          <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
            <Skills />
            <Education />
          </div>
        </section>
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
