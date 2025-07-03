/**
 * GPS DIAGNOSTIC TOOL - Complete System Verification
 * Tests every component of the GPS system step by step
 */

import { logGPS, logGPSError } from './appLogger';
import { getStoredToken } from './storage';

interface DiagnosticResult {
  step: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  details?: any;
}

class GPSDiagnosticService {
  private results: DiagnosticResult[] = [];

  async runCompleteGPSDiagnostic(): Promise<DiagnosticResult[]> {
    this.results = [];
    logGPS("🚨 === STARTING COMPLETE GPS DIAGNOSTIC ===");

    // Step 1: Check if we're on Android device
    await this.checkPlatform();

    // Step 2: Check AndroidGPS WebView interface availability
    await this.checkAndroidGPSInterface();

    // Step 3: Check Capacitor plugins
    await this.checkCapacitorPlugins();

    // Step 4: Test authentication token
    await this.checkAuthToken();

    // Step 5: Test JavaScript → Android communication
    await this.testJavaScriptAndroidBridge();

    // Step 6: Check GPS permissions
    await this.checkGPSPermissions();

    // Step 7: Test service startup
    await this.testServiceStartup();

    logGPS("🚨 === GPS DIAGNOSTIC COMPLETED ===");
    this.printDiagnosticSummary();
    
    return this.results;
  }

  private async checkPlatform(): Promise<void> {
    const userAgent = navigator.userAgent;
    const isAndroid = /Android/i.test(userAgent);
    const isWebView = /wv/i.test(userAgent);

    this.addResult({
      step: "Platform Detection",
      status: isAndroid ? 'PASS' : 'FAIL',
      message: isAndroid ? 'Running on Android device' : 'Not running on Android',
      details: { userAgent, isAndroid, isWebView }
    });

    logGPS(`📱 Platform: ${isAndroid ? 'Android' : 'Non-Android'}, WebView: ${isWebView}`);
  }

  private async checkAndroidGPSInterface(): Promise<void> {
    const windowExists = typeof window !== 'undefined';
    const androidGPSExists = !!(window as any)?.AndroidGPS;
    const startGPSExists = typeof (window as any)?.AndroidGPS?.startGPS === 'function';
    const stopGPSExists = typeof (window as any)?.AndroidGPS?.stopGPS === 'function';
    const updateStatusExists = typeof (window as any)?.AndroidGPS?.updateStatus === 'function';

    const allMethodsExist = startGPSExists && stopGPSExists && updateStatusExists;

    this.addResult({
      step: "AndroidGPS WebView Interface",
      status: allMethodsExist ? 'PASS' : 'FAIL',
      message: allMethodsExist ? 'All AndroidGPS methods available' : 'AndroidGPS interface incomplete',
      details: {
        windowExists,
        androidGPSExists,
        startGPSExists,
        stopGPSExists,
        updateStatusExists
      }
    });

    logGPS(`🔍 AndroidGPS Interface: ${allMethodsExist ? 'COMPLETE' : 'INCOMPLETE'}`);
  }

  private async checkCapacitorPlugins(): Promise<void> {
    try {
      const { registerPlugin } = await import('@capacitor/core');
      const hasCapacitor = !!registerPlugin;

      this.addResult({
        step: "Capacitor Core",
        status: hasCapacitor ? 'PASS' : 'FAIL',
        message: hasCapacitor ? 'Capacitor available' : 'Capacitor not available',
        details: { hasCapacitor }
      });

      logGPS(`🔌 Capacitor: ${hasCapacitor ? 'AVAILABLE' : 'NOT AVAILABLE'}`);
    } catch (error) {
      this.addResult({
        step: "Capacitor Core",
        status: 'FAIL',
        message: 'Capacitor import failed',
        details: { error: String(error) }
      });
    }
  }

  private async checkAuthToken(): Promise<void> {
    try {
      const token = await getStoredToken();
      const hasToken = !!token;
      const tokenLength = token?.length || 0;
      const isValidLength = tokenLength > 50; // JWT tokens are typically longer

      this.addResult({
        step: "Authentication Token",
        status: hasToken && isValidLength ? 'PASS' : 'WARNING',
        message: hasToken ? `Token available (${tokenLength} chars)` : 'No auth token',
        details: { hasToken, tokenLength, isValidLength }
      });

      logGPS(`🔑 Auth Token: ${hasToken ? `${tokenLength} characters` : 'MISSING'}`);
    } catch (error) {
      this.addResult({
        step: "Authentication Token",
        status: 'FAIL',
        message: 'Token check failed',
        details: { error: String(error) }
      });
    }
  }

  private async testJavaScriptAndroidBridge(): Promise<void> {
    if (!(window as any)?.AndroidGPS?.startGPS) {
      this.addResult({
        step: "JavaScript→Android Bridge Test",
        status: 'FAIL',
        message: 'AndroidGPS.startGPS not available for testing',
        details: {}
      });
      return;
    }

    try {
      // Test with dummy data - should return a string result
      const testResult = (window as any).AndroidGPS.startGPS(
        "TEST_DIAGNOSTIC",
        "TEST_VEHICLE", 
        "TEST_UIT",
        "TEST_TOKEN",
        2
      );

      const isValidResult = typeof testResult === 'string';
      const isSuccess = testResult?.includes('SUCCESS');

      this.addResult({
        step: "JavaScript→Android Bridge Test",
        status: isValidResult ? (isSuccess ? 'PASS' : 'WARNING') : 'FAIL',
        message: isValidResult ? `Bridge responsive: ${testResult}` : 'Bridge not responding',
        details: { testResult, isValidResult, isSuccess }
      });

      logGPS(`🌉 Bridge Test Result: ${testResult}`);

      // Clean up test - stop the test GPS
      if ((window as any)?.AndroidGPS?.stopGPS) {
        (window as any).AndroidGPS.stopGPS("TEST_DIAGNOSTIC");
      }

    } catch (error) {
      this.addResult({
        step: "JavaScript→Android Bridge Test",
        status: 'FAIL',
        message: 'Bridge test failed',
        details: { error: String(error) }
      });
    }
  }

  private async checkGPSPermissions(): Promise<void> {
    try {
      const { Geolocation } = await import('@capacitor/geolocation');
      const permissions = await Geolocation.checkPermissions();
      
      const fineLocationGranted = permissions.location === 'granted';
      const coarseLocationGranted = permissions.coarseLocation === 'granted';

      this.addResult({
        step: "GPS Permissions",
        status: fineLocationGranted ? 'PASS' : 'WARNING',
        message: `Fine: ${permissions.location}, Coarse: ${permissions.coarseLocation}`,
        details: permissions
      });

      logGPS(`📍 GPS Permissions: Fine=${permissions.location}, Coarse=${permissions.coarseLocation}`);
    } catch (error) {
      this.addResult({
        step: "GPS Permissions",
        status: 'FAIL',
        message: 'Permission check failed',
        details: { error: String(error) }
      });
    }
  }

  private async testServiceStartup(): Promise<void> {
    if (!(window as any)?.AndroidGPS?.startGPS) {
      this.addResult({
        step: "Service Startup Test",
        status: 'FAIL',
        message: 'Cannot test - AndroidGPS not available',
        details: {}
      });
      return;
    }

    try {
      const token = await getStoredToken();
      if (!token) {
        this.addResult({
          step: "Service Startup Test",
          status: 'FAIL',
          message: 'Cannot test - no auth token available',
          details: {}
        });
        return;
      }

      // Test actual service startup with real data
      const result = (window as any).AndroidGPS.startGPS(
        "DIAGNOSTIC_TEST",
        "DIAG_VEHICLE",
        "DIAGNOSTIC_UIT",
        token,
        2
      );

      const success = result?.includes('SUCCESS');

      this.addResult({
        step: "Service Startup Test",
        status: success ? 'PASS' : 'FAIL',
        message: success ? 'Service started successfully' : `Service failed: ${result}`,
        details: { result, success }
      });

      // Wait 3 seconds then check if service is transmitting
      setTimeout(async () => {
        logGPS("🔍 Checking if service is transmitting after 3 seconds...");
        // Stop the diagnostic service
        if ((window as any)?.AndroidGPS?.stopGPS) {
          (window as any).AndroidGPS.stopGPS("DIAGNOSTIC_TEST");
        }
      }, 3000);

    } catch (error) {
      this.addResult({
        step: "Service Startup Test",
        status: 'FAIL',
        message: 'Service test failed',
        details: { error: String(error) }
      });
    }
  }

  private addResult(result: DiagnosticResult): void {
    this.results.push(result);
    const icon = result.status === 'PASS' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌';
    logGPS(`${icon} ${result.step}: ${result.message}`);
  }

  private printDiagnosticSummary(): void {
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const warnings = this.results.filter(r => r.status === 'WARNING').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const total = this.results.length;

    logGPS(`📊 DIAGNOSTIC SUMMARY: ${passed}/${total} PASSED, ${warnings} WARNINGS, ${failed} FAILED`);
    
    if (failed > 0) {
      logGPS("❌ CRITICAL ISSUES FOUND:");
      this.results.filter(r => r.status === 'FAIL').forEach(r => {
        logGPS(`  - ${r.step}: ${r.message}`);
      });
    }

    if (warnings > 0) {
      logGPS("⚠️ WARNINGS:");
      this.results.filter(r => r.status === 'WARNING').forEach(r => {
        logGPS(`  - ${r.step}: ${r.message}`);
      });
    }
  }

  getResults(): DiagnosticResult[] {
    return this.results;
  }
}

export const gpsDiagnosticService = new GPSDiagnosticService();
export const runGPSDiagnostic = () => gpsDiagnosticService.runCompleteGPSDiagnostic();