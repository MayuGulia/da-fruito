import React from "react";
import { Hero } from "../components/home/Hero";
import { ValueStrip } from "../components/home/ValueStrip";
import { Collections } from "../components/home/Collections";
import { Materials } from "../components/home/Materials";
import { About } from "../components/home/About";
import { InstagramStrip } from "../components/home/Instagram";
import { Testimonials } from "../components/home/Testimonials";
import { Contact } from "../components/home/Contact";

export default function Home() {
  return (
    <div className="bg-walnut" data-testid="home-page">
      <Hero />
      <ValueStrip />
      <Collections />
      <Materials />
      <About />
      <InstagramStrip />
      <Testimonials />
      <Contact />
    </div>
  );
}
