/**
 * =============================================================================
 * V TRY-ON PLATFORM — APPIUM MOBILE CONFIGURATION & ELEMENT LOCATOR REGISTRY
 * =============================================================================
 * Target Application : com.example.vtryon (Android Native Client)
 * Automation Driver  : UiAutomator2 (Android 10 - 15)
 * Test Environment   : Android Emulator / Physical Device / Automated Verification
 * =============================================================================
 */

module.exports = {
  hostname: process.env.APPIUM_HOST || '127.0.0.1',
  port: parseInt(process.env.APPIUM_PORT || '4723', 10),
  path: '/',
  logLevel: 'info',
  capabilities: {
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': process.env.ANDROID_DEVICE_NAME || 'Android Emulator',
    'appium:platformVersion': process.env.ANDROID_PLATFORM_VERSION || '14.0',
    'appium:appPackage': 'com.example.vtryon',
    'appium:appActivity': 'com.example.vtryon.app.AppActivity',
    'appium:app': process.env.ANDROID_APK_PATH || '../frontend/app/build/outputs/apk/debug/app-debug.apk',
    'appium:noReset': false,
    'appium:fullReset': false,
    'appium:newCommandTimeout': 240,
    'appium:autoGrantPermissions': true,
    'appium:uiautomator2ServerInstallTimeout': 60000,
    'appium:adbExecTimeout': 30000
  },

  // Centralized selector registry matching frontend/app/src/main/res/layout/*.xml
  selectors: {
    // 1. Splash & Auth
    splash: {
      root: 'id:com.example.vtryon:id/splashContainer',
      logo: 'id:com.example.vtryon:id/ivSplashLogo',
      progress: 'id:com.example.vtryon:id/splashProgress'
    },
    auth: {
      toolbar: 'id:com.example.vtryon:id/loginToolbar',
      emailInput: 'id:com.example.vtryon:id/inputEmail',
      passwordInput: 'id:com.example.vtryon:id/inputPassword',
      loginButton: 'id:com.example.vtryon:id/btnLogin',
      errorBanner: 'id:com.example.vtryon:id/tvError'
    },

    // 2. Home Dashboard
    home: {
      header: 'id:com.example.vtryon:id/headerContainer',
      userProfile: 'id:com.example.vtryon:id/userProfileBlock',
      userName: 'id:com.example.vtryon:id/tvUserName',
      welcomeSubtitle: 'id:com.example.vtryon:id/tvWelcomeSubtitle',
      heroCard: 'id:com.example.vtryon:id/cardHeroStudio',
      btnStartTryOn: 'id:com.example.vtryon:id/btnStartTryOn',
      catTops: 'id:com.example.vtryon:id/cardCatTops',
      catBottoms: 'id:com.example.vtryon:id/cardCatBottoms',
      catDresses: 'id:com.example.vtryon:id/cardCatDresses',
      trendingRecycler: 'id:com.example.vtryon:id/rvTrendingOutfits',
      btnViewAllTrending: 'id:com.example.vtryon:id/btnViewAllTrending'
    },

    // 3. Catalogue & Outfits
    catalogue: {
      toolbar: 'id:com.example.vtryon:id/outfitsToolbar',
      searchBar: 'id:com.example.vtryon:id/searchBar',
      chipGroup: 'id:com.example.vtryon:id/chipGroupCategories',
      chipAll: 'id:com.example.vtryon:id/chipCategoryAll',
      outfitList: 'id:com.example.vtryon:id/rvOutfits',
      outfitCard: 'id:com.example.vtryon:id/cardOutfitItem',
      btnTryOnItem: 'id:com.example.vtryon:id/btnTryOnThisOutfit'
    },

    // 4. Try-On Studio
    studio: {
      toolbar: 'id:com.example.vtryon:id/tryOnToolbar',
      cardPersonPhoto: 'id:com.example.vtryon:id/cardPersonPhoto',
      ivPersonPhoto: 'id:com.example.vtryon:id/ivPersonPhoto',
      btnPickPhoto: 'id:com.example.vtryon:id/btnPickPhoto',
      btnQuickModel1: 'id:com.example.vtryon:id/btnQuickModel1',
      btnQuickModel2: 'id:com.example.vtryon:id/btnQuickModel2',
      badgePhotoSelected: 'id:com.example.vtryon:id/badgePhotoSelected',
      cardSelectedGarment: 'id:com.example.vtryon:id/cardSelectedGarment',
      ivSelectedGarment: 'id:com.example.vtryon:id/ivSelectedGarment',
      tvOutfitName: 'id:com.example.vtryon:id/tvOutfitName',
      tvCategoryBadge: 'id:com.example.vtryon:id/tvOutfitCategoryBadge',
      rvGarments: 'id:com.example.vtryon:id/rvGarments',
      chipUpperBody: 'id:com.example.vtryon:id/chipUpperBody',
      chipLowerBody: 'id:com.example.vtryon:id/chipLowerBody',
      chipDresses: 'id:com.example.vtryon:id/chipDresses',
      btnGenerate: 'id:com.example.vtryon:id/btnGenerate',
      errorMessage: 'id:com.example.vtryon:id/tvErrorMessage'
    },

    // 5. Processing & Polling
    processing: {
      toolbar: 'id:com.example.vtryon:id/processingToolbar',
      progressRing: 'id:com.example.vtryon:id/progressRing',
      statusTitle: 'id:com.example.vtryon:id/tvStatusTitle',
      statusSubtitle: 'id:com.example.vtryon:id/tvStatusSubtitle',
      jobId: 'id:com.example.vtryon:id/tvJobId',
      failureView: 'id:com.example.vtryon:id/failureContainer',
      btnRetry: 'id:com.example.vtryon:id/btnRetry',
      btnReturn: 'id:com.example.vtryon:id/btnReturn'
    },

    // 6. Result & Comparison
    result: {
      toolbar: 'id:com.example.vtryon:id/resultToolbar',
      ivResult: 'id:com.example.vtryon:id/ivResult',
      tvStatus: 'id:com.example.vtryon:id/tvStatus',
      btnDownload: 'id:com.example.vtryon:id/btnDownload',
      btnDone: 'id:com.example.vtryon:id/btnDone'
    },

    // 7. Settings & Account
    settings: {
      toolbar: 'id:com.example.vtryon:id/settingsToolbar',
      userEmail: 'id:com.example.vtryon:id/tvUserEmail',
      statFittings: 'id:com.example.vtryon:id/tvStatFittingsCount',
      switchDarkMode: 'id:com.example.vtryon:id/switchDarkMode',
      btnRefreshHistory: 'id:com.example.vtryon:id/btnRefreshHistory',
      rvHistory: 'id:com.example.vtryon:id/rvHistory',
      btnSignOut: 'id:com.example.vtryon:id/btnSignOut'
    }
  },

  timeouts: {
    implicit: 5000,
    explicit: 15000,
    inferencePolling: 60000
  }
};
