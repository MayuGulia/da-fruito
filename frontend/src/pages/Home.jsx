import React from "react";
import { Hero } from "../components/home/Hero";
import { FeaturedHampers } from "../components/home/FeaturedHampers";
import { ValueStrip } from "../components/home/ValueStrip";
import { Collections } from "../components/home/Collections";
import { Materials } from "../components/home/Materials";
import { ArtisanStory } from "../components/home/ArtisanStory";
import { About } from "../components/home/About";
import { Glimpses } from "../components/home/Glimpses";
import { ShopInstagram } from "../components/home/ShopInstagram";
import { Testimonials } from "../components/home/Testimonials";
import { AsSeenIn } from "../components/home/AsSeenIn";
import { Contact } from "../components/home/Contact";

export default function Home() {
  return (
    <div className="bg-white" data-testid="home-page">
      <Hero />
      <FeaturedHampers />
      <ValueStrip />
      <Collections />
      <Materials />
      <ArtisanStory />
      <About />
      <Glimpses />
      <Testimonials />
      <AsSeenIn />
      <ShopInstagram />
      <Contact />
    </div>
  );
}
