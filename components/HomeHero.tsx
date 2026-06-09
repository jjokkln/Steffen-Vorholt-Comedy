"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "homeHeroMode";
type HeroMode = "card" | "full";

export default function HomeHero() {
  const [mode, setMode] = useState<HeroMode>("card");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "full" || saved === "card") setMode(saved);
    } catch {
      // localStorage unavailable; the default mode still works.
    }
  }, []);

  function apply(next: HeroMode) {
    setMode(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage unavailable; in-memory state still toggles the layout.
    }
  }

  return (
    <header
      className={`container section hero home-hero${mode === "full" ? " is-full-video" : ""}`}
      data-home-hero
    >
      <div
        className="hero-layout-toggle"
        data-hero-layout-toggle
        role="group"
        aria-label="Hero-Darstellung testen"
      >
        <button
          type="button"
          className={mode === "card" ? "active" : ""}
          data-hero-mode="card"
          aria-pressed={mode === "card"}
          onClick={() => apply("card")}
        >
          Karte
        </button>
        <button
          type="button"
          className={mode === "full" ? "active" : ""}
          data-hero-mode="full"
          aria-pressed={mode === "full"}
          onClick={() => apply("full")}
        >
          Vollfläche
        </button>
      </div>
      <div className="hero-copy">
        <div className="eyebrow">
          <span className="dot"></span> Comedy-Universum · Neuss · NRW
        </div>
        <h1>
          Willkommen in Steffens <span className="gradient">Comedy-Universum</span>
        </h1>
        <p className="lead">
          Ich bin Steffen Vorholt – Comedian, Moderator und Veranstalter. Mit Brain Loading, Comedy
          Eiskalt und Comedy Check-In entsteht ein absurdes, buntes Show-Universum für echte
          Live-Comedy.
        </p>
        <div className="actions">
          <Link className="btn primary" href="/termine">
            🚀 Tickets ansehen
          </Link>
          <Link className="btn secondary" href="/shows">
            🪐 Shows entdecken
          </Link>
          <Link className="btn secondary" href="/steffen-buchen">
            🎤 Steffen buchen
          </Link>
        </div>
      </div>
      <div className="stage hero-stage">
        <div className="stage-card has-video">
          <video className="stage-card-video" autoPlay muted loop playsInline preload="metadata">
            <source src="/assets/media/steffen/steffen-stage-loop-hero.mp4" type="video/mp4" />
            Dein Browser kann das Bühnenvideo nicht wiedergeben.
          </video>
        </div>
        <span className="sticker s1">Lachen garantiert</span>
        <span className="sticker s2">Chaos? Garantiert.</span>
        <span className="sticker s3">Frage an den Piloten</span>
      </div>
    </header>
  );
}
