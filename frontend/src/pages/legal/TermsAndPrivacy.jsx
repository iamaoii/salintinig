import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { getMainAppUrl } from '../../utils/urlUtils';
import {
  ShieldCheck,
  FileText,
  ArrowLeft,
  Printer,
  MagnifyingGlass,
  LockKey,
  Student,
  Microphone,
  UserCheck,
  Buildings,
  Globe,
  Question,
  CaretRight,
  Cpu,
  CheckCircle,
  List,
  X,
} from '@phosphor-icons/react';
import logo from '../../assets/logo/logo.webp';

export default function TermsAndPrivacy() {
  const navigate = useNavigate();
  const location = useLocation();

  // Active main tab: 'overview' | 'privacy' | 'terms' | 'technologies' | 'faq'
  const [activeTab, setActiveTab] = useState(() => {
    const path = location.pathname.toLowerCase();
    if (path.includes('privacy')) return 'privacy';
    if (path.includes('terms')) return 'terms';
    if (path.includes('technologies')) return 'technologies';
    if (path.includes('faq')) return 'faq';
    return 'overview';
  });

  const [activeSection, setActiveSection] = useState('intro');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync tab with route path
  useEffect(() => {
    const path = location.pathname.toLowerCase();
    if (path.includes('privacy')) setActiveTab('privacy');
    else if (path.includes('terms')) setActiveTab('terms');
    else if (path.includes('technologies')) setActiveTab('technologies');
    else if (path.includes('faq')) setActiveTab('faq');
    else setActiveTab('overview');
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
      document.documentElement.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    let targetPath = '/overview';
    if (tab === 'privacy') targetPath = '/privacy';
    else if (tab === 'terms') targetPath = '/terms';
    else if (tab === 'technologies') targetPath = '/technologies';
    else if (tab === 'faq') targetPath = '/faq';

    window.history.replaceState(null, '', targetPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setActiveSection('intro');
  };

  const scrollToSection = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -(headerHeight + 24);
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Sections for Privacy Policy Sidebar
  const privacySidebarSections = [
    { id: 'priv-intro', title: 'Introduction' },
    { id: 'priv-collection', title: 'Information SalinTinig collects' },
    { id: 'priv-why-collect', title: 'Why SalinTinig collects data' },
    { id: 'priv-controls', title: 'Your privacy controls' },
    { id: 'priv-sharing', title: 'Sharing your information' },
    { id: 'priv-security', title: 'Keeping your information secure' },
    { id: 'priv-audio', title: 'Speech & voice data privacy' },
    { id: 'priv-retention', title: 'Retaining your information' },
    { id: 'priv-compliance', title: 'Compliance with RA 10173 (Data Privacy Act)' },
    { id: 'priv-about', title: 'About this policy' },
  ];

  // Sections for Terms of Service Sidebar
  const termsSidebarSections = [
    { id: 'tos-intro', title: 'Introduction' },
    { id: 'tos-relationship', title: 'Your relationship with SalinTinig' },
    { id: 'tos-using-services', title: 'Using SalinTinig services' },
    { id: 'tos-content', title: 'Content in SalinTinig services' },
    { id: 'tos-accounts', title: 'DepEd LRN & Employee ID rules' },
    { id: 'tos-disclaimer', title: 'Developer disclaimer & liability boundaries' },
    { id: 'tos-caching', title: 'Dual-layer caching & session storage' },
    { id: 'tos-problems', title: 'In case of problems or disagreements' },
    { id: 'tos-about', title: 'About these terms' },
  ];

  // Sections for Technologies Sidebar
  const techSidebarSections = [
    { id: 'tech-intro', title: 'Overview' },
    { id: 'tech-speech', title: 'Speech-to-Text Recognition Engine' },
    { id: 'tech-cache', title: 'Dual-Layer Cache Architecture' },
    { id: 'tech-security', title: 'Data Security & Masterlist Protection' },
  ];

  // Sections for FAQ Sidebar (Kept for ScrollSpy reference if needed)
  const faqSidebarSections = [];

  const [headerHeight, setHeaderHeight] = useState(113);

  // Measure exact header height dynamically for 0-movement sticky alignment
  useEffect(() => {
    const updateHeaderHeight = () => {
      const el = document.getElementById('salintinig-legal-header');
      if (el) {
        setHeaderHeight(el.getBoundingClientRect().height);
      }
    };
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    return () => window.removeEventListener('resize', updateHeaderHeight);
  }, []);

  // Auto ScrollSpy to update active section in left sidebar on scroll
  useEffect(() => {
    let sections = [];
    if (activeTab === 'privacy') sections = privacySidebarSections;
    else if (activeTab === 'terms') sections = termsSidebarSections;
    else if (activeTab === 'technologies') sections = techSidebarSections;

    if (sections.length === 0) return;

    const handleScroll = () => {
      // 1. If near top of page, force select first section
      if (window.scrollY < 80 && sections.length > 0) {
        setActiveSection(sections[0].id);
        return;
      }

      // 2. If reached the bottom of the page, force select last section
      const isBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 60;
      if (isBottom && sections.length > 0) {
        setActiveSection(sections[sections.length - 1].id);
        return;
      }

      // 3. Otherwise find section currently in view
      const scrollPosition = window.scrollY + headerHeight + 35;
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i].id);
        if (el) {
          const top = el.offsetTop;
          if (top <= scrollPosition) {
            setActiveSection(sections[i].id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeTab, headerHeight]);

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#202124] font-sans antialiased selection:bg-[#e8f0fe] selection:text-[#1a73e8]">
      {/* Top Google-Style Header */}
      <header id="salintinig-legal-header" className="sticky top-0 z-50 bg-white border-b border-[#dadce0] print:hidden">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            
            {/* Left: Mobile Hamburger Button + Logo */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 -ml-2 rounded-full text-[#5f6368] hover:bg-[#f1f3f4] active:bg-[#e8eaed] transition-colors cursor-pointer"
                aria-label="Toggle navigation menu"
              >
                <div className={`transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'rotate-90 scale-95' : 'rotate-0 scale-100'}`}>
                  {mobileMenuOpen ? <X size={22} weight="bold" /> : <List size={22} weight="bold" />}
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('overview')}
                className="flex items-center gap-2 group text-left cursor-pointer"
              >
                {/* Logo visible only on desktop */}
                <img src={logo} alt="SalinTinig" className="hidden md:block h-7 sm:h-8 w-auto" />
                
                {/* Desktop Title */}
                <span className="hidden md:flex text-xl tracking-tight text-[#202124] items-center gap-1.5">
                  <span className="font-semibold text-[#202124]">SalinTinig</span>
                  <span className="text-[#5f6368] font-normal text-lg">Privacy & Terms</span>
                </span>

                {/* Mobile Title: Dynamic based on activeTab */}
                <span className="md:hidden text-lg font-normal text-[#202124] flex items-center gap-2">
                  {activeTab === 'overview' && 'Privacy & Terms'}
                  {activeTab === 'privacy' && 'Privacy Policy'}
                  {activeTab === 'terms' && 'Terms of Service'}
                  {activeTab === 'technologies' && 'Technologies'}
                  {activeTab === 'faq' && 'FAQ'}
                </span>
              </button>
            </div>
          </div>

          {/* Desktop Horizontal Nav Tabs (Google Policies Style) */}
          <nav className="hidden md:flex space-x-8 -mb-px overflow-x-auto no-scrollbar">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'privacy', label: 'Privacy Policy' },
              { id: 'terms', label: 'Terms of Service' },
              { id: 'technologies', label: 'Technologies' },
              { id: 'faq', label: 'FAQ' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`py-3.5 px-1 text-sm whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'border-b-[3px] border-[#1a73e8] text-[#1a73e8] font-bold'
                      : 'border-b-2 border-transparent text-[#5f6368] font-medium hover:text-[#202124] hover:border-[#dadce0]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Mobile Slide-Out Drawer Navigation (Google Blue Pill Rounded Right Style with Smooth Animation) */}
        <div
          className={`md:hidden fixed inset-0 z-50 flex print:hidden transition-all duration-300 ${
            mobileMenuOpen ? 'pointer-events-auto opacity-100 visible' : 'pointer-events-none opacity-0 invisible delay-300'
          }`}
          aria-hidden={!mobileMenuOpen}
        >
          {/* Backdrop with Smooth Fade & Backdrop Blur */}
          <div
            className={`fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300 ease-in-out touch-none overscroll-contain ${
              mobileMenuOpen ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={() => setMobileMenuOpen(false)}
            onTouchMove={(e) => e.preventDefault()}
          />

          {/* Slide Drawer Content with Smooth Cubic-Bezier Easing */}
          <div
            className={`relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col pt-5 pb-6 overflow-y-auto overscroll-contain z-10 transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            {/* Drawer Title Header (Matching Google's Header format) */}
            <div className="px-6 pb-5 flex items-center justify-between border-b border-[#f1f3f4]">
              <div className="flex items-center gap-2">
                <img src={logo} alt="SalinTinig" className="h-6 w-auto" />
                <span className="text-base text-[#202124] leading-none">
                  <span className="font-semibold text-[#202124]">SalinTinig</span>{' '}
                  <span className="font-normal text-[#5f6368] text-sm">Privacy & Terms</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-full text-[#5f6368] hover:bg-[#f1f3f4] transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X size={20} weight="bold" />
              </button>
            </div>

            {/* Drawer Menu Nav Items (Google Blue Pill Rounded Right Style) */}
            <div className="pt-4 space-y-1 pr-4">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'privacy', label: 'Privacy Policy' },
                { id: 'terms', label: 'Terms of Service' },
                { id: 'technologies', label: 'Technologies' },
                { id: 'faq', label: 'FAQ' },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full text-left py-3 px-6 text-sm transition-all duration-200 cursor-pointer rounded-r-full ${
                      isActive
                        ? 'bg-[#e8f0fe] text-[#1a73e8] font-bold'
                        : 'text-[#3c4043] font-normal hover:bg-[#f8f9fa] hover:text-[#202124]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* PAGE BODY ACCORDING TO ACTIVE TAB */}
      {activeTab === 'overview' && (
        <main className="mx-auto max-w-[1200px] w-full flex-1 px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
            
            {/* Card 1: Privacy Policy */}
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-[#202124]">Privacy Policy</h2>
              <p className="text-sm text-[#5f6368] leading-relaxed">
                Explains what information SalinTinig collects and why, how we use it, and how to review and update student assessment records under Republic Act No. 10173.
              </p>
              <button
                onClick={() => handleTabChange('privacy')}
                className="inline-block text-sm font-medium text-[#1a73e8] hover:underline cursor-pointer pt-1"
              >
                Read our Privacy Policy &rarr;
              </button>
            </div>

            {/* Card 2: Terms of Service */}
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-[#202124]">Terms of Service</h2>
              <p className="text-sm text-[#5f6368] leading-relaxed">
                Describes the rules you agree to when using our Phil-IRI oral reading assessment services, unique DepEd LRN enforcement, and developer liability disclaimers.
              </p>
              <button
                onClick={() => handleTabChange('terms')}
                className="inline-block text-sm font-medium text-[#1a73e8] hover:underline cursor-pointer pt-1"
              >
                Read our Terms of Service &rarr;
              </button>
            </div>

            {/* Card 3: SalinTinig Safety Center */}
            <div className="space-y-3">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#e8f0fe] text-[#1a73e8]">
                  <ShieldCheck size={26} weight="bold" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-[#202124]">SalinTinig Safety & Security Center</h2>
                  <p className="text-sm text-[#5f6368] leading-relaxed">
                    Protecting learners and educators means providing built-in security, SQL injection parameterization, and strict LRN uniqueness controls.
                  </p>
                  <button
                    onClick={() => handleTabChange('technologies')}
                    className="inline-block text-sm font-medium text-[#1a73e8] hover:underline cursor-pointer"
                  >
                    Explore how we keep you safe &rarr;
                  </button>
                </div>
              </div>
            </div>

            {/* Card 4: Account Security */}
            <div className="space-y-3">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#feefe3] text-[#d97706]">
                  <UserCheck size={26} weight="bold" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-[#202124]">SalinTinig Account Protection</h2>
                  <p className="text-sm text-[#5f6368] leading-relaxed">
                    Control, protect, and secure teacher, admin, and parent accounts. Enforces salted bcrypt password hashing and token authorization.
                  </p>
                  <button
                    onClick={() => handleTabChange('faq')}
                    className="inline-block text-sm font-medium text-[#1a73e8] hover:underline cursor-pointer"
                  >
                    View Account Safety FAQ &rarr;
                  </button>
                </div>
              </div>
            </div>

            {/* Card 5: Our Privacy and Security Principles */}
            <div className="space-y-3">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#e6f4ea] text-[#137333]">
                  <LockKey size={26} weight="bold" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-[#202124]">Our Privacy and Security Principles</h2>
                  <p className="text-sm text-[#5f6368] leading-relaxed">
                    We build privacy that works for every school. It is a responsibility that comes with digitizing Phil-IRI assessments while respecting student data rights.
                  </p>
                  <button
                    onClick={() => handleTabChange('privacy')}
                    className="inline-block text-sm font-medium text-[#1a73e8] hover:underline cursor-pointer"
                  >
                    Explore our Privacy Principles &rarr;
                  </button>
                </div>
              </div>
            </div>

            {/* Card 6: Dual-Layer Caching & Technology */}
            <div className="space-y-3">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#fce8e6] text-[#c5221f]">
                  <Cpu size={26} weight="bold" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-[#202124]">Technical & Dual-Layer Cache Guide</h2>
                  <p className="text-sm text-[#5f6368] leading-relaxed">
                    Learn how SalinTinig uses in-memory and session caching to support smooth assessment flow under low-bandwidth classroom environments.
                  </p>
                  <button
                    onClick={() => handleTabChange('technologies')}
                    className="inline-block text-sm font-medium text-[#1a73e8] hover:underline cursor-pointer"
                  >
                    View Technical Architecture &rarr;
                  </button>
                </div>
              </div>
            </div>

          </div>
        </main>
      )}

      {/* PRIVACY POLICY TAB */}
      {activeTab === 'privacy' && (
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Left Sidebar Menu */}
            <aside style={{ top: `${headerHeight}px`, maxHeight: `calc(100vh - ${headerHeight}px)` }} className="lg:col-span-3 sticky hidden lg:block space-y-1 text-sm border-r border-[#f1f3f4] pr-6 py-6 overflow-y-auto">
              {privacySidebarSections.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => scrollToSection(sec.id)}
                  className={`w-full text-left py-2 px-3 rounded-r-md transition-colors cursor-pointer border-l-2 ${
                    activeSection === sec.id
                      ? 'border-[#1a73e8] text-[#1a73e8] font-bold bg-[#e8f0fe]/60'
                      : 'border-transparent text-[#5f6368] font-semibold hover:text-[#202124] hover:bg-[#f8f9fa]'
                  }`}
                >
                  {sec.title}
                </button>
              ))}
            </aside>

            {/* Right Main Legal Document */}
            <div className="lg:col-span-9 max-w-3xl space-y-10 py-6">
              
              {/* Header Banner */}
              <div className="space-y-4 pb-6 border-b border-[#dadce0]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#5f6368]">
                  SALINTINIG PRIVACY POLICY
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#202124] leading-snug">
                  When you use our services, you’re trusting us with your information. We understand this is a big responsibility and work hard to protect your information and put you in control.
                </h1>
                <div className="text-xs text-[#5f6368] space-x-2 pt-2">
                  <span>Effective October 1, 2026</span>
                  <span>&bull;</span>
                  <button onClick={() => window.print()} className="text-[#1a73e8] hover:underline cursor-pointer font-medium">
                    Print PDF
                  </button>
                  <span>&bull;</span>
                  <span>Country version: Philippines</span>
                </div>
              </div>

              {/* Document Content */}
              <div className="space-y-10 text-sm text-[#3c4043] leading-relaxed">
                
                {/* 1. Introduction */}
                <section id="priv-intro" className="space-y-3 scroll-mt-[137px]">
                  <h2 className="text-xl font-bold text-[#202124]">1. Introduction</h2>
                  <p>
                    This Privacy Policy is meant to help you understand what information SalinTinig collects, why we collect it, and how you can update, manage, export, and delete student reading assessment records.
                  </p>
                  <p>
                    SalinTinig is designed for DepEd schools to administer the Philippine Informal Reading Inventory (Phil-IRI) digitally. We respect data privacy rights established under Republic Act No. 10173 (Data Privacy Act of 2012).
                  </p>
                </section>

                {/* 2. Information SalinTinig collects */}
                <section id="priv-collection" className="space-y-3 scroll-mt-[137px]">
                  <h2 className="text-xl font-bold text-[#202124]">2. Information SalinTinig collects</h2>
                  <p>
                    We collect information to provide better educational assessment services to all users—from evaluating student reading speeds to generating official Phil-IRI Form 1-4 reports.
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm">
                    <li><strong>Learner Identification:</strong> 12-Digit Learner Reference Number (LRN), Full Name, Gender, Grade Level, and Section.</li>
                    <li><strong>Assessment Performance:</strong> Reading miscues (hesitation, repetition, omission, insertion, substitution, mispronunciation), words per minute (WPM), reading accuracy %, and comprehension question responses.</li>
                    <li><strong>Teacher & Admin Information:</strong> DepEd Employee ID, Name, Institutional Email Address, and Assigned Advisory Section.</li>
                    <li><strong>Voice Audio Recordings:</strong> Temporary oral reading audio captured during test sessions solely for miscue transcription and teacher verification.</li>
                  </ul>
                </section>

                {/* 3. Why SalinTinig collects data */}
                <section id="priv-why-collect" className="space-y-3 scroll-mt-[137px]">
                  <h2 className="text-xl font-bold text-[#202124]">3. Why SalinTinig collects data</h2>
                  <p>We use the data we collect for the following core educational purposes:</p>
                  <ul className="list-disc pl-6 space-y-1.5">
                    <li>Automating Phil-IRI individual reading profiles (Non-Reader, Frustration, Instructional, Independent).</li>
                    <li>Providing educators with actionable reading miscue breakdowns for targeted remedial instruction.</li>
                    <li>Enabling parents to inspect their child's reading growth securely via LRN access codes.</li>
                  </ul>
                </section>

                {/* 4. Your privacy controls */}
                <section id="priv-controls" className="space-y-3 scroll-mt-[137px]">
                  <h2 className="text-xl font-bold text-[#202124]">4. Your privacy controls</h2>
                  <p>
                    Educators and parents have options regarding the information we collect and how it is used:
                  </p>
                  <p>
                    Class Advisers can review, edit, or update student section rosters. School Administrators manage official masterlists and can delete invalid records.
                  </p>
                </section>

                {/* 5. Sharing your information */}
                <section id="priv-sharing" className="space-y-3 scroll-mt-[137px]">
                  <h2 className="text-xl font-bold text-[#202124]">5. Sharing your information</h2>
                  <p>
                    We do not share personal information or student reading recordings with companies, organizations, or individuals outside DepEd except in the following cases:
                  </p>
                  <ul className="list-disc pl-6 space-y-1.5">
                    <li><strong>With Educational Consent:</strong> Sharing student performance reports with verified parents/guardians and school division heads.</li>
                    <li><strong>For Legal Reasons:</strong> To satisfy applicable laws, regulations, or enforceable DepEd administrative requests.</li>
                  </ul>
                </section>

                {/* 6. Keeping your information secure */}
                <section id="priv-security" className="space-y-3 scroll-mt-[137px]">
                  <h2 className="text-xl font-bold text-[#202124]">6. Keeping your information secure</h2>
                  <p>
                    We build security into our services to protect your information. SalinTinig employs multi-layered technical security safeguards:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 font-mono text-xs text-[#202124]">
                    <li><strong>Parameterized Queries (`db.query($1, $2)`):</strong> Eliminates SQL injection vulnerabilities across all database operations.</li>
                    <li><strong>Bcrypt Password Encryption:</strong> Passwords are salted and hashed using standard bcrypt algorithms.</li>
                    <li><strong>Route Obfuscation (`encodeSecureToken`):</strong> URL parameters use Base64URL obfuscation to prevent direct ID enumeration.</li>
                  </ul>
                </section>

                {/* 7. Speech & voice data privacy */}
                <section id="priv-audio" className="space-y-3 scroll-mt-[137px]">
                  <h2 className="text-xl font-bold text-[#202124]">7. Speech & voice data privacy</h2>
                  <p>
                    Voice recordings captured during oral reading tests are used strictly for assessment miscue analysis and teacher verification. Voice data is <strong>never sold or shared for commercial advertising</strong>.
                  </p>
                </section>

                {/* 8. Retaining your information */}
                <section id="priv-retention" className="space-y-3 scroll-mt-[137px]">
                  <h2 className="text-xl font-bold text-[#202124]">8. Retaining your information</h2>
                  <p>
                    We retain student Phil-IRI records for the duration of the learner's elementary enrollment to maintain multi-year reading progress logs.
                  </p>
                </section>

                {/* 9. Compliance with RA 10173 */}
                <section id="priv-compliance" className="space-y-3 scroll-mt-[137px]">
                  <h2 className="text-xl font-bold text-[#202124]">9. Compliance with RA 10173 (Data Privacy Act of 2012)</h2>
                  <p>
                    SalinTinig complies fully with Republic Act No. 10173, its Implementing Rules and Regulations, and National Privacy Commission (NPC) circulars.
                  </p>
                </section>

                {/* 10. About this policy */}
                <section id="priv-about" className="space-y-3 scroll-mt-[137px] pb-64">
                  <h2 className="text-xl font-bold text-[#202124]">10. About this policy</h2>
                  <p>
                    This Privacy Policy applies to all SalinTinig web and mobile applications. For privacy questions, contact our Data Protection Officer at <a href="mailto:salintinig.ph@gmail.com" className="text-[#1a73e8] hover:underline font-medium">salintinig.ph@gmail.com</a>.
                  </p>
                </section>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* TERMS OF SERVICE TAB */}
      {activeTab === 'terms' && (
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Left Sidebar Menu */}
            <aside style={{ top: `${headerHeight}px`, maxHeight: `calc(100vh - ${headerHeight}px)` }} className="lg:col-span-3 sticky hidden lg:block space-y-1 text-sm border-r border-[#f1f3f4] pr-6 py-6 overflow-y-auto">
              {termsSidebarSections.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => scrollToSection(sec.id)}
                  className={`w-full text-left py-2 px-3 rounded-r-md transition-colors cursor-pointer border-l-2 ${
                    activeSection === sec.id
                      ? 'border-[#1a73e8] text-[#1a73e8] font-bold bg-[#e8f0fe]/60'
                      : 'border-transparent text-[#5f6368] font-semibold hover:text-[#202124] hover:bg-[#f8f9fa]'
                  }`}
                >
                  {sec.title}
                </button>
              ))}
            </aside>

            {/* Right Main Legal Document */}
            <div className="lg:col-span-9 max-w-3xl space-y-10 py-6">
              
              {/* Header Banner */}
              <div className="space-y-4 pb-6 border-b border-[#dadce0]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#5f6368]">
                  SALINTINIG TERMS OF SERVICE
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#202124] leading-snug">
                  We know it’s tempting to skip these Terms of Service, but it’s important to establish what you can expect from us as you use SalinTinig services, and what we expect from you.
                </h1>
                <div className="text-xs text-[#5f6368] space-x-2 pt-2">
                  <span>Effective July 30, 2026</span>
                  <span>&bull;</span>
                  <button onClick={() => window.print()} className="text-[#1a73e8] hover:underline cursor-pointer font-medium">
                    Print PDF
                  </button>
                  <span>&bull;</span>
                  <span>Country version: Philippines</span>
                </div>
              </div>

              {/* Document Content */}
              <div className="space-y-10 text-sm text-[#3c4043] leading-relaxed">

                {/* 1. Introduction */}
                <section id="tos-intro" className="space-y-3 scroll-mt-[137px]">
                  <h2 className="text-xl font-bold text-[#202124]">1. Introduction</h2>
                  <p>
                    These Terms of Service help define the relationship between you and SalinTinig. Broadly speaking, we give you permission to use our services if you agree to follow these terms, which reflect how SalinTinig works and the laws that apply to our company.
                  </p>
                </section>

                {/* 2. Your relationship with SalinTinig */}
                <section id="tos-relationship" className="space-y-3 scroll-mt-[137px]">
                  <h2 className="text-xl font-bold text-[#202124]">2. Your relationship with SalinTinig</h2>
                  <p>
                    SalinTinig provides digital assessment software to DepEd elementary schools. Teachers, school administrators, and parents agree to utilize the platform exclusively for authorized educational evaluation.
                  </p>
                </section>

                {/* 3. Using SalinTinig services */}
                <section id="tos-using-services" className="space-y-3 scroll-mt-[137px]">
                  <h2 className="text-xl font-bold text-[#202124]">3. Using SalinTinig services</h2>
                  <p>
                    You must follow any policies made available to you within the services. Do not misuse our services—for example, do not interfere with our services or try to access them using a method other than the interface and instructions that we provide.
                  </p>
                </section>

                {/* 4. Content in SalinTinig services */}
                <section id="tos-content" className="space-y-3 scroll-mt-[137px]">
                  <h2 className="text-xl font-bold text-[#202124]">4. Content in SalinTinig services</h2>
                  <p>
                    Reading assessment passages, scoring rubrics, and Phil-IRI evaluation guidelines within SalinTinig are standardized educational content.
                  </p>
                </section>

                {/* 5. DepEd LRN & Employee ID rules */}
                <section id="tos-accounts" className="space-y-3 scroll-mt-[137px]">
                  <h2 className="text-xl font-bold text-[#202124]">5. DepEd LRN & Employee ID rules</h2>
                  <p>
                    To enforce masterlist integrity, every student account requires a unique 12-digit DepEd Learner Reference Number (LRN), and every teacher account requires a unique DepEd Employee ID.
                  </p>
                  <ul className="list-disc pl-6 space-y-1.5">
                    <li>Duplicate LRN registration is automatically blocked by the system.</li>
                    <li>Student LRNs are non-transferable between accounts to preserve multi-year Phil-IRI audit trails.</li>
                  </ul>
                </section>

                {/* 6. Developer disclaimer & liability boundaries */}
                <section id="tos-disclaimer" className="space-y-3 scroll-mt-[137px]">
                  <h2 className="text-xl font-bold text-[#202124]">6. Developer disclaimer & liability boundaries</h2>
                  <p>
                    <strong>Assistive AI Disclaimer:</strong> SalinTinig’s automated speech recognition and miscue detections function strictly as <em>assistive educational tools</em>. Final evaluation and official grade entries remain under the sole professional authority of certified DepEd educators. Developers accept no liability for teaching evaluations or student placement decisions.
                  </p>
                  <p>
                    <strong>AS-IS Provision:</strong> SalinTinig is provided on an "AS-IS" and "AS-AVAILABLE" basis. Developers disclaim liability for assessment disruptions resulting from hardware limitations (e.g., faulty device microphones) or local internet outages.
                  </p>
                </section>

                {/* 7. Dual-layer caching & session storage */}
                <section id="tos-caching" className="space-y-3 scroll-mt-[137px]">
                  <h2 className="text-xl font-bold text-[#202124]">7. Dual-layer caching & session storage</h2>
                  <p>
                    SalinTinig incorporates a Dual-Layer Cache Engine (`CacheService` with `salintinig_cache_v3_` namespace) to optimize page loading speed under low-bandwidth network environments.
                  </p>
                  <ul className="list-disc pl-6 space-y-1.5">
                    <li><strong>In-Memory Cache:</strong> Retains active datasets in RAM for instantaneous UI rendering.</li>
                    <li><strong>Session Storage:</strong> Safely buffers temporary views across page reloads without storing sensitive passwords.</li>
                    <li><strong>Cache Invalidation:</strong> Updates to records automatically invalidate cached entries (`cacheService.invalidate()`).</li>
                  </ul>
                </section>

                {/* 8. In case of problems or disagreements */}
                <section id="tos-problems" className="space-y-3 scroll-mt-[137px]">
                  <h2 className="text-xl font-bold text-[#202124]">8. In case of problems or disagreements</h2>
                  <p>
                    By law, you have the right to a certain level of service quality, and options for how to resolve problems if things go wrong. These terms do not limit or take away any of those rights.
                  </p>
                </section>

                {/* 9. About these terms */}
                <section id="tos-about" className="space-y-3 scroll-mt-[137px] pb-64">
                  <h2 className="text-xl font-bold text-[#202124]">9. About these terms</h2>
                  <p>
                    These terms are governed by the laws of the Republic of the Philippines. If you do not comply with these terms, and we don’t take action right away, that doesn’t mean we’re giving up any rights that we may have.
                  </p>
                </section>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* TECHNOLOGIES TAB */}
      {activeTab === 'technologies' && (
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <aside style={{ top: `${headerHeight}px`, maxHeight: `calc(100vh - ${headerHeight}px)` }} className="lg:col-span-3 sticky hidden lg:block space-y-1 text-sm border-r border-[#f1f3f4] pr-6 py-6 overflow-y-auto">
              {techSidebarSections.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => scrollToSection(sec.id)}
                  className={`w-full text-left py-2 px-3 rounded-r-md transition-colors cursor-pointer border-l-2 ${
                    activeSection === sec.id
                      ? 'border-[#1a73e8] text-[#1a73e8] font-bold bg-[#e8f0fe]/60'
                      : 'border-transparent text-[#5f6368] font-semibold hover:text-[#202124] hover:bg-[#f8f9fa]'
                  }`}
                >
                  {sec.title}
                </button>
              ))}
            </aside>

            <div className="lg:col-span-9 max-w-3xl space-y-10 py-6">
              <div className="space-y-4 pb-6 border-b border-[#dadce0]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#5f6368]">TECHNOLOGIES</span>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#202124]">How SalinTinig uses technology responsibly</h1>
                <p className="text-sm text-[#5f6368]">
                  We pursue ideas and technologies that push the boundaries of automated reading evaluation, while working hard to make sure any innovation is balanced with privacy, data security, and high availability.
                </p>
              </div>

              <div className="space-y-10 text-sm text-[#3c4043] leading-relaxed">
                
                {/* 1. Overview */}
                <section id="tech-intro" className="space-y-3 scroll-mt-[137px]">
                  <h2 className="text-xl font-bold text-[#202124]">1. Overview</h2>
                  <p>
                    SalinTinig is engineered to streamline Philippine Informal Reading Inventory (Phil-IRI) assessments across elementary schools. Our technology stack balances real-time speech processing with robust offline resilience and enterprise-grade data protection.
                  </p>
                </section>

                {/* 2. Speech-to-Text Recognition Engine */}
                <section id="tech-speech" className="space-y-3 scroll-mt-[137px]">
                  <h2 className="text-xl font-bold text-[#202124]">2. Speech-to-Text Recognition Engine</h2>
                  <p>
                    Our speech processing engine analyzes real-time oral reading audio streams against Phil-IRI standard passages. It automatically detects 6 primary oral reading miscue types:
                  </p>
                  <ul className="list-disc pl-6 space-y-1.5">
                    <li><strong>Omission:</strong> Skipped words or phrases during reading.</li>
                    <li><strong>Insertion:</strong> Extra unscripted words added by the student.</li>
                    <li><strong>Substitution:</strong> Replacing passage words with alternate pronunciations or terms.</li>
                    <li><strong>Hesitation & Repetition:</strong> Pauses exceeding 3 seconds or repeated word attempts.</li>
                    <li><strong>Mispronunciation:</strong> Incorrect phonetic rendering of passage vocabulary.</li>
                  </ul>
                  <p className="text-xs text-[#5f6368] italic pt-1">
                    Audio processing occurs over encrypted TLS connections and functions as an assistive tool for DepEd educators.
                  </p>
                </section>

                {/* 3. Dual-Layer Cache Architecture */}
                <section id="tech-cache" className="space-y-3 scroll-mt-[137px]">
                  <h2 className="text-xl font-bold text-[#202124]">3. Dual-Layer Cache Architecture</h2>
                  <p>
                    To ensure smooth performance in low-bandwidth classroom environments, SalinTinig implements a custom dual-layer cache engine (`CacheService` with `salintinig_cache_v3_` namespace):
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>In-Memory Layer (`MemoryCache`):</strong> Holds active section rosters and test passages in RAM for zero-latency UI rendering.</li>
                    <li><strong>Session Storage Layer:</strong> Safely buffers temporary assessment progress across page reloads without exposing plain-text credentials.</li>
                    <li><strong>Automatic Invalidation:</strong> Backend mutations automatically invalidate stale cache keys (`cacheService.invalidate()`) to prevent data drift.</li>
                  </ul>
                </section>

                {/* 4. Data Security & Masterlist Protection */}
                <section id="tech-security" className="space-y-3 scroll-mt-[137px] pb-64">
                  <h2 className="text-xl font-bold text-[#202124]">4. Data Security & Masterlist Protection</h2>
                  <p>
                    SalinTinig protects student Phil-IRI assessment records and teacher accounts through multi-layered security controls:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Parameterized SQL Queries:</strong> All database operations use strict parameterized inputs (`db.query($1, $2)`), completely eliminating SQL injection vulnerabilities.</li>
                    <li><strong>DepEd LRN & Employee ID Verification:</strong> Enforces unique 12-digit LRNs and Teacher Employee IDs at both API and database levels to prevent masterlist duplication.</li>
                    <li><strong>Salted Bcrypt Encryption & JWT:</strong> User passwords are salted and hashed with bcrypt, while session access is authorized using stateless JSON Web Tokens.</li>
                  </ul>
                </section>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAQ TAB (Official Google Privacy FAQ Typography Layout) */}
      {activeTab === 'faq' && (
        <main className="mx-auto max-w-3xl w-full flex-1 px-4 py-12 sm:px-6 lg:px-8">
          <div className="space-y-14 text-sm text-[#3c4043] leading-relaxed pb-24">
            
            {/* FAQ 1 */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-[#202124] tracking-tight">
                How does SalinTinig protect my privacy and keep information secure?
              </h2>
              <p>
                We know security and privacy are important to learners, educators, and parents—and they are important to us, too. We make it a priority to provide strong security and give you confidence that student reading records are safe and accessible when you need them.
              </p>
              <p>
                We employ parameterized database queries, salted bcrypt password hashing, and role-based token authorization to protect your information.
              </p>
              <p>
                You can learn more about how we keep your personal information private and safe in our{' '}
                <button onClick={() => handleTabChange('privacy')} className="text-[#1a73e8] hover:underline font-medium cursor-pointer">
                  Privacy Policy
                </button>{' '}
                or explore our{' '}
                <button onClick={() => handleTabChange('technologies')} className="text-[#1a73e8] hover:underline font-medium cursor-pointer">
                  Technologies Architecture Guide
                </button>.
              </p>
            </section>

            {/* FAQ 2 */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-[#202124] tracking-tight">
                How is student reading speed (WPM) and accuracy calculated?
              </h2>
              <p>
                SalinTinig tracks the exact elapsed reading duration from passage start to completion. Words Per Minute (WPM) is computed using standard Phil-IRI formulas:
              </p>
              <div className="p-3 bg-[#f8f9fa] border-l-4 border-[#1a73e8] text-xs font-mono text-[#202124]">
                WPM = (Total Words Read / Seconds Elapsed) &times; 60
              </div>
              <p>
                Reading Accuracy Percentage is calculated by subtracting total verified miscues (omissions, insertions, substitutions, hesitations, mispronunciations) from total passage words, divided by total passage length.
              </p>
            </section>

            {/* FAQ 3 */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-[#202124] tracking-tight">
                What happens if a Learner Reference Number (LRN) already exists?
              </h2>
              <p>
                To maintain DepEd masterlist integrity, every student account requires a unique 12-digit Learner Reference Number (LRN). The system automatically checks database indexes:
              </p>
              <ol className="list-decimal pl-6 space-y-1.5">
                <li>If an LRN is already registered in the system, duplicate creation is blocked automatically.</li>
                <li>Learner profiles remain tied to their unique LRN to preserve multi-year Phil-IRI progress logs.</li>
              </ol>
            </section>

            {/* FAQ 4 */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-[#202124] tracking-tight">
                Are student oral reading voice recordings stored or shared?
              </h2>
              <p>
                No. Temporary voice audio streams captured during assessment sessions are processed strictly for oral reading miscue analysis and teacher verification. Voice recordings are <strong>never sold, analyzed for commercial advertising, or shared with third parties</strong>.
              </p>
            </section>

            {/* FAQ 5 */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-[#202124] tracking-tight">
                How does SalinTinig work in classrooms with low internet bandwidth?
              </h2>
              <p>
                SalinTinig incorporates a custom Dual-Layer Cache Engine (`MemoryCache` + `sessionStorage`). Class section rosters and reading passages are cached locally in RAM so assessment forms render instantly without requiring constant network requests.
              </p>
            </section>

            {/* FAQ 6 */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-[#202124] tracking-tight">
                How can parents access their child’s reading assessment records?
              </h2>
              <p>
                Parents can log into the Parent Portal using their child’s official 12-digit DepEd LRN and parent security PIN provided by the Class Adviser. Parents can view reading performance summaries, comprehension marks, and growth charts.
              </p>
            </section>

            {/* FAQ 7 */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-[#202124] tracking-tight">
                Is automated miscue detection final, or can teachers adjust scores?
              </h2>
              <p>
                SalinTinig’s AI speech recognition functions strictly as an <em>assistive educational tool</em>. Certified DepEd teachers retain full authority to review, edit, or override miscues and comprehension marks before finalizing official Phil-IRI Form 1-4 records.
              </p>
            </section>

          </div>
        </main>
      )}

      {/* Google-Style Footer */}
      <footer className="mt-auto border-t border-[#dadce0] bg-[#f8f9fa] px-4 py-8 sm:px-6 lg:px-8 print:hidden">
        <div className="mx-auto max-w-[1400px] flex flex-col sm:flex-row items-center sm:justify-between gap-4 text-xs text-[#5f6368] text-center sm:text-left">
          
          {/* Left / Top: Logo + System Tagline */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2 gap-y-1">
            <a href={getMainAppUrl('/')} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity group">
              <img src={logo} alt="SalinTinig" className="h-5 w-auto grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
              <span className="font-semibold text-[#202124] group-hover:underline">SalinTinig</span>
            </a>
            <span className="hidden sm:inline">&bull;</span>
            <span className="text-[#5f6368] block sm:inline">DepEd Phil-IRI Automated Assessment System</span>
          </div>

          {/* Right / Bottom: Nav Links */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#dadce0]/50 w-full sm:w-auto">
            <button onClick={() => handleTabChange('privacy')} className="hover:text-[#202124] transition-colors cursor-pointer">
              Privacy
            </button>
            <button onClick={() => handleTabChange('terms')} className="hover:text-[#202124] transition-colors cursor-pointer">
              Terms
            </button>
            <button onClick={() => handleTabChange('technologies')} className="hover:text-[#202124] transition-colors cursor-pointer">
              Technologies
            </button>
            <button onClick={() => handleTabChange('faq')} className="hover:text-[#202124] transition-colors cursor-pointer">
              FAQ
            </button>
            <a href={getMainAppUrl('/login')} className="text-[#1a73e8] font-medium hover:underline">
              Sign In
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
