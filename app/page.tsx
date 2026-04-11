import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import FeaturesShowcase from "../components/FeaturesShowcase";
import MicroWeaknessSection from "../components/MicroWeaknessSection";
import SmartRevisionSection from "../components/SmartRevisionSection";
import LiveDashboardSection from "../components/LiveDashboardSection";
import FooterSection from "../components/FooterSection";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <FeaturesShowcase />
      <MicroWeaknessSection />
      <SmartRevisionSection />
      <LiveDashboardSection />
      <FooterSection />
    </main>
  );
}