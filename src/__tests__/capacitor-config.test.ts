import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import capacitorConfig from "../../capacitor.config";

describe("Capacitor Native Android Packaging & Config (Roadmap Step 5)", () => {
  it("should have correct appId, appName, and webDir in capacitor.config.ts", () => {
    expect(capacitorConfig.appId).toBe("com.nutritrack.ai");
    expect(capacitorConfig.appName).toBe("NutriTrack AI");
    expect(capacitorConfig.webDir).toBe("public");
  });

  it("should configure Vercel production server URL and cleartext mode for hybrid backend communication", () => {
    expect(capacitorConfig.server).toBeDefined();
    expect(capacitorConfig.server?.url).toBe("https://ai-calorie-activity-tracker.vercel.app");
    expect(capacitorConfig.server?.cleartext).toBe(true);
  });

  it("should allow mixed content on Android for seamless local/remote asset and API bridge", () => {
    expect(capacitorConfig.android).toBeDefined();
    expect(capacitorConfig.android?.allowMixedContent).toBe(true);
  });

  it("should ensure the synced capacitor.config.json in Android assets matches the master configuration", () => {
    const assetsConfigPath = path.resolve(process.cwd(), "android/app/src/main/assets/capacitor.config.json");
    expect(fs.existsSync(assetsConfigPath)).toBe(true);

    const jsonContent = JSON.parse(fs.readFileSync(assetsConfigPath, "utf-8"));
    expect(jsonContent.appId).toBe("com.nutritrack.ai");
    expect(jsonContent.appName).toBe("NutriTrack AI");
    expect(jsonContent.server?.url).toBe("https://ai-calorie-activity-tracker.vercel.app");
    expect(jsonContent.server?.cleartext).toBe(true);
    expect(jsonContent.android?.allowMixedContent).toBe(true);
  });

  it("should verify required hardware and network permissions in AndroidManifest.xml", () => {
    const manifestPath = path.resolve(process.cwd(), "android/app/src/main/AndroidManifest.xml");
    expect(fs.existsSync(manifestPath)).toBe(true);

    const manifestContent = fs.readFileSync(manifestPath, "utf-8");

    // Check permissions
    expect(manifestContent).toContain('android.permission.CAMERA');
    expect(manifestContent).toContain('android.permission.INTERNET');
    expect(manifestContent).toContain('android.permission.ACCESS_NETWORK_STATE');
    expect(manifestContent).toContain('android.permission.VIBRATE');

    // Check camera feature with required="false"
    expect(manifestContent).toContain('android.hardware.camera');
    expect(manifestContent).toMatch(/<uses-feature[^>]*android:name="android\.hardware\.camera"[^>]*android:required="false"/);
  });

  it("should verify Capacitor dependencies in package.json", () => {
    const pkgPath = path.resolve(process.cwd(), "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));

    expect(pkg.dependencies["@capacitor/core"]).toBeDefined();
    expect(pkg.dependencies["@capacitor/cli"]).toBeDefined();
    expect(pkg.dependencies["@capacitor/android"]).toBeDefined();
  });
});
