import React from 'react';


export default function Video() {
  return (
    <section className="w-full py-16 px-6 bg-surface-container-low/40">
      <div className="max-w-4xl mx-auto flex flex-col items-center text-center space-y-6">
        <h2 className="text-2xl md:text-3xl font-extrabold text-on-surface">
          See how INGAT protects your family&apos;s future
        </h2>
        <p className="text-sm md:text-base text-on-surface-variant max-w-xl font-medium">
          A quick walkthrough of how easily you can connect your wallet, specify split ratios, and lock financial goals.
        </p>

        {/* YouTube Video Embed */}
        <div className="relative w-full aspect-video bg-inverse-surface rounded-2xl overflow-hidden border border-outline-variant shadow-2xl flex items-center justify-center">
          <iframe
            className="absolute inset-0 w-full h-full"
            src="https://www.youtube.com/embed/9uETgnoeQsc"
            title="INGAT Remittance Demo Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  );
}
