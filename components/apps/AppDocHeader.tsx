import Image from "next/image";
import type { NoviqueApp } from "@/lib/apps/registry";

/**
 * Shared header for an app's document pages (support, privacy): the app icon,
 * the app name as a branded eyebrow, and the page title in the app's ink color.
 */
export default function AppDocHeader({
  app,
  title,
}: {
  app: NoviqueApp;
  title: string;
}) {
  const b = app.brand;
  return (
    <div>
      <div className="flex items-center gap-3">
        <Image
          src={app.icon.src}
          alt={app.icon.alt}
          width={44}
          height={44}
          className="rounded-[12px] ring-1 ring-black/5"
        />
        <span className="text-base font-bold" style={{ color: b.eyebrow }}>
          {app.appStoreName}
        </span>
      </div>
      <h1 className="mt-4 text-4xl font-bold" style={{ color: b.ink }}>
        {title}
      </h1>
    </div>
  );
}
