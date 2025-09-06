//
//  iOSGPSPlugin.m
//  iTrack GPS - Objective-C Bridge
//
//  Capacitor plugin registration pentru iOSGPSPlugin
//

#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// Define the plugin with all exposed methods (identic cu AndroidGPS)
CAP_PLUGIN(iOSGPSPlugin, "iOSGPS",
    CAP_PLUGIN_METHOD(startGPS, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(updateStatus, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(stopGPS, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(clearAllOnLogout, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(markManualPause, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(showPersistentNotification, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(hidePersistentNotification, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(showQuickNotification, CAPPluginReturnPromise);
)