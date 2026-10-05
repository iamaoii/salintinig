import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { 
  DownloadSimple, 
  AndroidLogo, 
  CheckCircle, 
  Info, 
  CaretDown, 
  CaretUp, 
  QrCode, 
  ArrowLeft,
  ShieldCheck,
  DeviceMobile
} from '@phosphor-icons/react';
import logo from '../../assets/logo/logo.webp';
import { mobileAppConfig } from '../../config/mobileApp';
import { getMainAppUrl } from '../../utils/urlUtils';

const GITHUB_LATEST_RELEASE_API = 'https://api.github.com/repos/iamaoii/salintinig/releases/latest';

function formatBytes(bytes) {
  const size = Number(bytes);
  if (!Number.isFinite(size) || size <= 0) return mobileAppConfig.fileSize;
  const mb = size / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

function formatReleaseDate(dateString) {
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return mobileAppConfig.updatedAt;
  return parsed.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

function normalizeVersion(tagName, releaseName) {
  const raw = (tagName || releaseName || mobileAppConfig.version).toString().trim();
  return raw.replace(/^v/i, '').replace(/^SalinTinig\s+/i, '').trim() || mobileAppConfig.version;
}

export default function MobileDownloadPage() {
  const [showHowToInstall, setShowHowToInstall] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(mobileAppConfig.latestApkUrl);
  const [releaseMeta, setReleaseMeta] = useState({
    version: mobileAppConfig.version,
    versionCode: mobileAppConfig.versionCode,
    apkFilename: mobileAppConfig.apkFilename,
    fileSize: mobileAppConfig.fileSize,
    updatedAt: mobileAppConfig.updatedAt,
    isLive: false,
  });
  const [pageUrl, setPageUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const host = window.location.hostname.toLowerCase();
      if (import.meta.env.VITE_APP_URL) {
        setPageUrl(`${import.meta.env.VITE_APP_URL}/download`);
      } else if (host === 'localhost' || host === '127.0.0.1') {
        // Default to production domain so physical mobile phone cameras scan a valid public URL
        setPageUrl(`https://salintinig.org/download`);
      } else {
        setPageUrl(`${window.location.origin}/download`);
      }
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadLatestRelease() {
      try {
        const response = await fetch(GITHUB_LATEST_RELEASE_API, {
          headers: {
            Accept: 'application/vnd.github+json',
          },
        });
        if (!response.ok) return;

        const release = await response.json();
        const assets = Array.isArray(release.assets) ? release.assets : [];
        const latestAsset =
          assets.find((asset) => asset.name === 'SalinTinig-latest.apk') ||
          assets.find((asset) => /^SalinTinig-v.*\.apk$/i.test(asset.name || '')) ||
          assets.find((asset) => /\.apk$/i.test(asset.name || ''));

        if (!latestAsset || !isMounted) return;

        setDownloadUrl(latestAsset.browser_download_url || mobileAppConfig.latestApkUrl);
        setReleaseMeta({
          version: normalizeVersion(release.tag_name, release.name),
          versionCode: null,
          apkFilename: latestAsset.name || mobileAppConfig.apkFilename,
          fileSize: formatBytes(latestAsset.size),
          updatedAt: formatReleaseDate(latestAsset.updated_at || release.published_at || release.created_at),
          isLive: true,
        });
      } catch (error) {
        console.warn('Unable to fetch latest mobile release metadata:', error);
      }
    }

    loadLatestRelease();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa] text-[#202124] font-sans">
      {/* Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#dadce0] px-4 py-3 sm:px-8">
        <div className="mx-auto max-w-[1200px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 text-[#5f6368] hover:text-[#202124] transition-colors p-1.5 rounded-full hover:bg-[#f1f3f4]">
              <ArrowLeft size={20} weight="bold" />
            </Link>
            <Link to="/" className="flex items-center gap-2 group">
              <img src={logo} alt="SalinTinig" className="h-8 w-auto" />
              <span className="font-bold text-xl text-[#202124] tracking-tight group-hover:underline">SalinTinig</span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-semibold bg-[#e8f0fe] text-[#1a73e8] rounded-full">
                Mobile
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 mx-auto max-w-[1100px] w-full px-4 py-8 sm:px-6 sm:py-12">
        {/* Hero Mobile App Section */}
        <div className="bg-white rounded-3xl border border-[#dadce0] p-6 sm:p-10 shadow-sm mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Column: Information & Actions */}
            <div className="lg:col-span-7 flex flex-col items-start">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e6f4ea] text-[#137333] text-xs font-bold mb-4">
                <AndroidLogo size={16} weight="fill" />
                <span>Available for Android</span>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-[#1a73e8] p-3 shadow-md flex items-center justify-center shrink-0">
                  <img src={logo} alt="SalinTinig App Icon" className="h-full w-full object-contain filter drop-shadow brightness-0 invert" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#202124] tracking-tight">
                    {mobileAppConfig.appName}
                  </h1>
                  <p className="text-xs sm:text-sm text-[#5f6368] font-medium mt-0.5">
                    {mobileAppConfig.tagline}
                  </p>
                </div>
              </div>

              <p className="text-sm sm:text-base text-[#3c4043] leading-relaxed mb-6">
                Bring SalinTinig with you on your Android device. Perform Phil-IRI oral reading assessment tasks, record student speech, track reading levels, and sync assessment data directly with your school portal account.
              </p>

              {/* Primary Download CTA Button */}
              <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
                <a
                  href={downloadUrl}
                  download={releaseMeta.apkFilename}
                  className="inline-flex items-center justify-center gap-3 px-7 py-3.5 rounded-full bg-[#1a73e8] text-white font-bold text-sm sm:text-base hover:bg-[#1557b0] transition-colors shadow-md hover:shadow-lg active:scale-[0.99] cursor-pointer"
                >
                  <DownloadSimple size={22} weight="bold" />
                  <span>Download for Android</span>
                </a>
              </div>

              {/* Technical Specifications Grid */}
              <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#f1f3f4] text-xs text-[#5f6368]">
                <div>
                  <span className="block text-[#9aa0a6] uppercase text-[10px] font-bold tracking-wider">Version</span>
                  <span className="font-semibold text-[#202124]">
                    {releaseMeta.version}{releaseMeta.versionCode ? ` (${releaseMeta.versionCode})` : ''}
                  </span>
                </div>
                <div>
                  <span className="block text-[#9aa0a6] uppercase text-[10px] font-bold tracking-wider">File Size</span>
                  <span className="font-semibold text-[#202124]">{releaseMeta.fileSize}</span>
                </div>
                <div>
                  <span className="block text-[#9aa0a6] uppercase text-[10px] font-bold tracking-wider">Requirement</span>
                  <span className="font-semibold text-[#202124]">{mobileAppConfig.minimumAndroid}</span>
                </div>
                <div>
                  <span className="block text-[#9aa0a6] uppercase text-[10px] font-bold tracking-wider">Updated</span>
                  <span className="font-semibold text-[#202124]">{releaseMeta.updatedAt}</span>
                </div>
              </div>
            </div>

            {/* Right Column: QR Code Container (Desktop & Tablet) */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center border-t lg:border-t-0 lg:border-l border-[#f1f3f4] pt-6 lg:pt-0 lg:pl-8">
              <div className="bg-[#f8f9fa] border border-[#dadce0] rounded-2xl p-5 flex flex-col items-center text-center shadow-inner max-w-[280px] w-full">
                <div className="bg-white p-3 rounded-xl border border-[#dadce0] shadow-sm mb-3">
                  {pageUrl ? (
                    <QRCodeSVG 
                      value={pageUrl} 
                      size={180} 
                      level="H"
                      includeMargin={false}
                    />
                  ) : (
                    <div className="h-[180px] w-[180px] bg-[#f1f3f4] flex items-center justify-center text-[#9aa0a6]">
                      <QrCode size={48} />
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#202124] mb-1">
                  <QrCode size={16} className="text-[#1a73e8]" />
                  <span>Scan to Download</span>
                </div>
                <p className="text-[11px] text-[#5f6368] leading-tight">
                  Point your phone's camera to scan and download the SalinTinig APK directly to your phone.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* How to Install Section (Accordion) */}
        <div className="bg-white rounded-2xl border border-[#dadce0] shadow-sm overflow-hidden mb-8">
          <button
            type="button"
            onClick={() => setShowHowToInstall(!showHowToInstall)}
            className="w-full px-6 py-4 flex items-center justify-between text-left bg-white hover:bg-[#f8f9fa] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-[#e8f0fe] text-[#1a73e8] flex items-center justify-center font-bold text-sm">
                ?
              </div>
              <div>
                <h3 className="font-bold text-base text-[#202124]">How to Install (Manual Installation Guide)</h3>
                <p className="text-xs text-[#5f6368]">Simple step-by-step instructions for installing the SalinTinig APK on Android</p>
              </div>
            </div>
            {showHowToInstall ? <CaretUp size={20} className="text-[#5f6368]" /> : <CaretDown size={20} className="text-[#5f6368]" />}
          </button>

          {showHowToInstall && (
            <div className="px-6 pb-6 pt-2 border-t border-[#f1f3f4] bg-white">
              <ol className="space-y-4 text-sm text-[#3c4043] my-4">
                <li className="flex items-start gap-3">
                  <span className="flex items-center justify-center shrink-0 h-6 w-6 rounded-full bg-[#1a73e8] text-white font-bold text-xs">1</span>
                  <div>
                    <span className="font-bold text-[#202124]">Download the APK:</span> Tap the <strong>Download for Android</strong> button above or scan the QR code to save <code className="bg-[#f1f3f4] px-1.5 py-0.5 rounded text-xs font-mono text-[#202124]">{releaseMeta.apkFilename}</code> to your device.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex items-center justify-center shrink-0 h-6 w-6 rounded-full bg-[#1a73e8] text-white font-bold text-xs">2</span>
                  <div>
                    <span className="font-bold text-[#202124]">Open the File:</span> When the download completes, tap the download notification or open the APK file from your browser's Downloads or File Manager.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex items-center justify-center shrink-0 h-6 w-6 rounded-full bg-[#1a73e8] text-white font-bold text-xs">3</span>
                  <div>
                    <span className="font-bold text-[#202124]">Allow Unknown Sources (if prompted):</span> If Android displays a prompt blocking installation, tap <strong>Settings</strong> and toggle on <strong>Allow from this source</strong> for your browser or file app.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex items-center justify-center shrink-0 h-6 w-6 rounded-full bg-[#1a73e8] text-white font-bold text-xs">4</span>
                  <div>
                    <span className="font-bold text-[#202124]">Tap Install:</span> Tap <strong>Install</strong> to proceed with installation.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex items-center justify-center shrink-0 h-6 w-6 rounded-full bg-[#1a73e8] text-white font-bold text-xs">5</span>
                  <div>
                    <span className="font-bold text-[#202124]">Open SalinTinig:</span> Once finished, tap <strong>Open</strong> to launch SalinTinig and log in to your account.
                  </div>
                </li>
              </ol>

              {/* Play Protect / Security Note */}
              <div className="mt-4 p-4 rounded-xl bg-[#e8f0fe]/60 border border-[#c2e7ff] text-xs text-[#174ea6] flex items-start gap-3">
                <ShieldCheck size={20} className="shrink-0 text-[#1a73e8] mt-0.5" weight="fill" />
                <div>
                  <span className="font-bold block text-[#1a73e8] mb-0.5">Android Security Notice</span>
                  Android may show a standard prompt when installing APK files directly outside the Google Play Store. SalinTinig is cryptographically signed using our official release key and contains no harmful code.
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#dadce0] bg-white px-4 py-6 text-center text-xs text-[#5f6368]">
        <div className="mx-auto max-w-[1200px] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={logo} alt="" className="h-4 w-auto grayscale opacity-70" />
            <span>SalinTinig &bull; DepEd Phil-IRI Automated Assessment System</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="hover:text-[#202124] transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-[#202124] transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
