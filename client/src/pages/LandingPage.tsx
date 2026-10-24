import React from 'react';
import {
  LandingNavbar,
  LandingHero,
  LandingAboutUs,
  LandingServices,
  LandingContact,
  LandingFooter
} from '../components/landing';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#071727] text-slate-900 dark:text-white font-sans scroll-smooth">
      <LandingNavbar />
      <LandingHero />
      <LandingAboutUs />
      <LandingServices />
      <LandingContact />
      <LandingFooter />
    </div>
  );
};

export default LandingPage;
