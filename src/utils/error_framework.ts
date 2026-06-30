import { useState, useEffect } from 'react';

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AppError {
  code: string;
  title: string;
  description: string;
  techLog: string;
  severity: ErrorSeverity;
  recoveryAction: string;
  retryActionLabel?: string;
  onRetry?: () => void;
}

export interface PermissionState {
  status: 'prompt' | 'granted' | 'denied' | 'permanently_denied';
  purpose: string;
  consequences: string;
  resolutionSteps: string;
}

export interface PermissionsRegistry {
  camera: PermissionState;
  microphone: PermissionState;
  location: PermissionState;
  notifications: PermissionState;
  storage: PermissionState;
}

// Structured developer logging helper
export function logTechnicalError(error: AppError) {
  const timestamp = new Date().toISOString();
  console.group(`%c[CIVORA-SYSTEM-LOG] ${timestamp} - [${error.code}] ${error.title}`, 'color: #ef4444; font-weight: bold;');
  console.log(`Severity: ${error.severity.toUpperCase()}`);
  console.log(`User Message: ${error.description}`);
  console.log(`Technical Trace: ${error.techLog}`);
  console.log(`Recovery Guideline: ${error.recoveryAction}`);
  console.groupEnd();
}

// Predefined error generator functions for all system modules (1-15)
export const ErrorCatalog = {
  // 3. CAMERA WORKFLOW
  camera: {
    unavailable: (retry?: () => void): AppError => ({
      code: 'CAM_UNAVAILABLE',
      title: 'Camera Hardware Not Detected',
      description: 'Civora is unable to locate an active camera on this device.',
      techLog: 'navigator.mediaDevices.enumerateDevices returned empty video input array or DeviceNotFoundException.',
      severity: 'error',
      recoveryAction: 'Check if your camera is properly plugged in, turned on, or physically uncovered.',
      retryActionLabel: 'Re-detect Hardware',
      onRetry: retry
    }),
    denied: (retry?: () => void): AppError => ({
      code: 'CAM_PERMISSION_DENIED',
      title: 'Camera Access Denied',
      description: 'Civora requires camera access to capture immediate visual evidence of the reported civic hazard.',
      techLog: 'MediaStreamError: PermissionDeniedError - User dismissed or clicked block on browser prompt.',
      severity: 'warning',
      recoveryAction: 'Click the camera/lock icon in your browser address bar and grant Civora access.',
      retryActionLabel: 'Request Access Again',
      onRetry: retry
    }),
    permanentlyDenied: (retry?: () => void): AppError => ({
      code: 'CAM_PERMISSION_PERM_DENIED',
      title: 'Camera Blocked Globally',
      description: 'Camera permissions are permanently blocked for Civora in your browser settings.',
      techLog: 'PermissionState is "denied" with persistent flag. MediaDevices.getUserMedia rejected immediately.',
      severity: 'error',
      recoveryAction: 'Go to your Browser Settings > Privacy & Security > Site Settings > Civora > Camera, and toggle the permission to "Allow".',
      retryActionLabel: 'I have changed my settings',
      onRetry: retry
    }),
    initFailure: (retry?: () => void): AppError => ({
      code: 'CAM_INITIALIZATION_FAILURE',
      title: 'Failed to Initialize Camera',
      description: 'The camera started, but failed to establish a stable video stream feed.',
      techLog: 'DOMException: Could not start video source. Kernel or driver error loading media pipeline.',
      severity: 'error',
      recoveryAction: 'Close other applications using the camera or perform a quick device restart.',
      retryActionLabel: 'Force Restart Camera',
      onRetry: retry
    }),
    alreadyInUse: (retry?: () => void): AppError => ({
      code: 'CAM_ALREADY_IN_USE',
      title: 'Camera Locked by Another App',
      description: 'Your camera is already in use by another running program (e.g. Zoom, Meet, Teams).',
      techLog: 'MediaStreamError: NotAllowedError - Device is locked by another capture process.',
      severity: 'warning',
      recoveryAction: 'Close all background video conferencing programs, browser tabs, or capture tools and retry.',
      retryActionLabel: 'Check Device Lock',
      onRetry: retry
    }),
    unsupported: (): AppError => ({
      code: 'CAM_BROWSER_UNSUPPORTED',
      title: 'Browser Lacks Video APIs',
      description: 'Your current browser does not support standard web-camera capture protocols.',
      techLog: 'navigator.mediaDevices or getUserMedia is undefined in secure context scope.',
      severity: 'error',
      recoveryAction: 'Please upgrade your web browser, or switch to Google Chrome, Firefox, Safari, or Microsoft Edge.'
    }),
    userCancelled: (): AppError => ({
      code: 'CAM_CAPTURE_CANCELLED',
      title: 'Camera Capture Cancelled',
      description: 'You closed the camera preview window before taking a photograph.',
      techLog: 'Camera session terminated gracefully by user event: cancelClick.',
      severity: 'info',
      recoveryAction: 'Re-open the camera panel to capture evidence when you are ready.'
    })
  },

  // 4. VIDEO WORKFLOW
  video: {
    cancelled: (): AppError => ({
      code: 'VID_RECORDING_CANCELLED',
      title: 'Video Recording Cancelled',
      description: 'The video recording session was aborted and the temporary buffer cleared.',
      techLog: 'MediaRecorder state set to inactive. Segment files discarded by user action.',
      severity: 'info',
      recoveryAction: 'No action needed. You can start a fresh video recording at any time.'
    }),
    failure: (retry?: () => void): AppError => ({
      code: 'VID_RECORDING_FAILURE',
      title: 'Video Capture Pipeline Failure',
      description: 'The recording stopped unexpectedly due to an internal capture pipeline error.',
      techLog: 'MediaRecorder error event fired: encoding/buffer overflow.',
      severity: 'error',
      recoveryAction: 'Verify that your device has sufficient hardware memory and active CPU overhead remaining.',
      retryActionLabel: 'Retry Recording',
      onRetry: retry
    }),
    limitExceeded: (): AppError => ({
      code: 'VID_LIMIT_EXCEEDED',
      title: 'Recording Duration Limit Reached',
      description: 'The video recording auto-stopped as it reached the maximum municipal limit of 20 seconds.',
      techLog: 'MediaRecorder maximum time slice budget (20000ms) exceeded. Graceful truncation executed.',
      severity: 'warning',
      recoveryAction: 'Keep your video clips brief and targeted directly at the physical hazard layout.'
    }),
    unsupportedFormat: (): AppError => ({
      code: 'VID_UNSUPPORTED_FORMAT',
      title: 'Unsupported Video Format',
      description: 'The selected video codec or container is not supported by standard web playback engines.',
      techLog: 'MimeType check failed. Browser is unable to transcode requested container profile.',
      severity: 'error',
      recoveryAction: 'Ensure your device records in MP4, WebM, or standard H.264 formats.'
    }),
    corrupted: (retry?: () => void): AppError => ({
      code: 'VID_RECORDING_CORRUPTED',
      title: 'Corrupted Video Data Detected',
      description: 'The recorded video payload is corrupted or contains incomplete headers.',
      techLog: 'Blob inspection failed: initial signature magic bytes do not match container specs.',
      severity: 'error',
      recoveryAction: 'Delete the current video clip and perform a fresh 5-10 second recording.',
      retryActionLabel: 'Re-record Video',
      onRetry: retry
    })
  },

  // 5. PHOTO WORKFLOW
  photo: {
    cancelled: (): AppError => ({
      code: 'PHO_CAPTURE_CANCELLED',
      title: 'Photo Capture Cancelled',
      description: 'Photo capture sequence was cancelled before save.',
      techLog: 'Canvas stream snapshot discarded before conversion to Blob payload.',
      severity: 'info',
      recoveryAction: 'Re-trigger the shutter button when you are aligned with the target.'
    }),
    failed: (retry?: () => void): AppError => ({
      code: 'PHO_CAPTURE_FAILED',
      title: 'Photo Shutter Failure',
      description: 'An error occurred during canvas stream snapshot capturing.',
      techLog: 'CanvasRenderingContext2D.drawImage threw SecurityError or drawing bounds exception.',
      severity: 'error',
      recoveryAction: 'Refresh the camera stream and ensure the lens is clean and well-lit.',
      retryActionLabel: 'Try Capture Again',
      onRetry: retry
    }),
    corrupted: (retry?: () => void): AppError => ({
      code: 'PHO_IMAGE_CORRUPTED',
      title: 'Corrupted Image Structure',
      description: 'The snapped image is corrupted and cannot be displayed or cached.',
      techLog: 'JPEG/PNG header bytes are incomplete or failed structure checksum validation.',
      severity: 'error',
      recoveryAction: 'Take a new picture of the scene.',
      retryActionLabel: 'Retake Photo',
      onRetry: retry
    }),
    unsupported: (): AppError => ({
      code: 'PHO_UNSUPPORTED_IMAGE',
      title: 'Unsupported Image Type',
      description: 'Civora does not support this image format (only JPEG, PNG, and WebP are allowed).',
      techLog: 'Blob MIME type check failed. Restrictive filter matched custom image type.',
      severity: 'warning',
      recoveryAction: 'Please select or capture a standard web-safe image (JPEG or PNG).'
    }),
    compressionFailure: (retry?: () => void): AppError => ({
      code: 'PHO_COMPRESSION_FAILURE',
      title: 'Image Compression Failed',
      description: 'Civora could not optimize and compress the image before transmission.',
      techLog: 'WebAssembly canvas compressor crashed or returned null pointer.',
      severity: 'error',
      recoveryAction: 'Ensure your device has free memory, or upload a smaller file resolution directly.',
      retryActionLabel: 'Re-try Compression',
      onRetry: retry
    })
  },

  // 6. AUDIO WORKFLOW
  audio: {
    micDenied: (retry?: () => void): AppError => ({
      code: 'AUD_MIC_PERMISSION_DENIED',
      title: 'Microphone Permission Blocked',
      description: 'Civora requires microphone permissions to record ambient sounds and audio description memos.',
      techLog: 'MediaStreamError: PermissionDeniedError - Microphone access declined.',
      severity: 'warning',
      recoveryAction: 'Enable microphone permissions by clicking the lock icon next to your URL bar.',
      retryActionLabel: 'Enable Microphone',
      onRetry: retry
    }),
    cancelled: (): AppError => ({
      code: 'AUD_RECORDING_CANCELLED',
      title: 'Audio Recording Cancelled',
      description: 'The voice recording was aborted and the temporary audio track discarded.',
      techLog: 'Audio capture session closed via graceful cancellation event.',
      severity: 'info',
      recoveryAction: 'Re-record the voice note when you are ready to explain the issue details.'
    }),
    failure: (retry?: () => void): AppError => ({
      code: 'AUD_RECORDING_FAILURE',
      title: 'Voice Recording Failure',
      description: 'Failed to record audio from your device microphone.',
      techLog: 'AudioContext or MediaRecorder failed to start stream processing.',
      severity: 'error',
      recoveryAction: 'Verify that your hardware microphone is enabled and not in use by another app.',
      retryActionLabel: 'Restart Audio Record',
      onRetry: retry
    }),
    compressionFailure: (retry?: () => void): AppError => ({
      code: 'AUD_COMPRESSION_FAILURE',
      title: 'Audio Compressing Failed',
      description: 'Civora failed to compress the recorded voice note down to web-transfer size.',
      techLog: 'LameJS/OggEncoder failed to finalize file footer block.',
      severity: 'error',
      recoveryAction: 'Ensure you speak clearly and keep recordings under 30 seconds.',
      retryActionLabel: 'Retry Compressing',
      onRetry: retry
    }),
    unsupported: (): AppError => ({
      code: 'AUD_UNSUPPORTED',
      title: 'Unsupported Audio Standard',
      description: 'Your browser lacks the ability to output web-standard audio containers.',
      techLog: 'MimeType audio/webm or audio/ogg is completely unsupported in this client engine.',
      severity: 'error',
      recoveryAction: 'Update your client browser to Google Chrome or Safari to capture audio voice notes.'
    })
  },

  // 7. MEDIA COMPRESSION
  compression: {
    failed: (fileType: string, retry?: () => void): AppError => ({
      code: 'MED_COMPRESSION_FAILURE',
      title: `${fileType} Compression Error`,
      description: `We failed to compress your ${fileType.toLowerCase()} file to fit standard bandwidth transfer rules.`,
      techLog: `Media transcode thread timed out after 10000ms. Compression worker terminated.`,
      severity: 'error',
      recoveryAction: 'Please lower the media capture resolution or use a smaller input file.',
      retryActionLabel: 'Retry Optimization',
      onRetry: retry
    })
  },

  // 8. STORAGE (NOT CONNECTED YET)
  storage: {
    unavailable: (): AppError => ({
      code: 'STOR_UNCONFIGURED',
      title: 'Cloud Storage Not Configured',
      description: 'Media upload is currently unavailable because cloud storage has not been configured yet.',
      techLog: 'Firebase Storage URL or bucket is undefined. Cloud API credentials have not been linked.',
      severity: 'error',
      recoveryAction: 'Civora is currently running in a safe sandboxed environment. Please log complaints using mock text/geotag fallback.'
    })
  },

  // 9. LOCATION
  location: {
    disabled: (retry?: () => void): AppError => ({
      code: 'LOC_GPS_DISABLED',
      title: 'GPS Location Is Disabled',
      description: 'Your device location service is turned off. Civora needs GPS coordinates to geo-locate the complaint.',
      techLog: 'GeolocationPositionError: POSITION_UNAVAILABLE - GPS receiver hardware is inactive.',
      severity: 'error',
      recoveryAction: 'Pull down your device notification tray and enable "Location Services" or "GPS".',
      retryActionLabel: 'Re-scan GPS',
      onRetry: retry
    }),
    denied: (retry?: () => void): AppError => ({
      code: 'LOC_PERMISSION_DENIED',
      title: 'Location Access Denied',
      description: 'Civora requires location access to automatically tag reports and prevent duplicate neighborhood tickets.',
      techLog: 'GeolocationPositionError: PERMISSION_DENIED - Geolocation request declined by client.',
      severity: 'warning',
      recoveryAction: 'Allow Civora to view your location by tapping "Allow" on the browser popup.',
      retryActionLabel: 'Grant Geolocation Access',
      onRetry: retry
    }),
    permanentlyDenied: (retry?: () => void): AppError => ({
      code: 'LOC_PERMISSION_PERM_DENIED',
      title: 'Location Blocked Globally',
      description: 'Civora is blocked from receiving location coordinates in your browser settings.',
      techLog: 'Geolocation query returned persistent denied permission state.',
      severity: 'error',
      recoveryAction: 'Go to Browser Settings > Privacy > Site Permissions > Location > Civora, and select "Allow".',
      retryActionLabel: 'I have enabled location',
      onRetry: retry
    }),
    gpsUnavailable: (retry?: () => void): AppError => ({
      code: 'LOC_GPS_UNAVAILABLE',
      title: 'GPS Signal Unavailable',
      description: 'We cannot acquire a lock on high-accuracy satellite signals (poor reception).',
      techLog: 'GeolocationPositionError: Satellite search timeout or dilution of precision > 15m.',
      severity: 'warning',
      recoveryAction: 'Move closer to a window, step outdoors, or pick a position on the manual map picker.',
      retryActionLabel: 'Retry GPS Fix',
      onRetry: retry
    }),
    timeout: (retry?: () => void): AppError => ({
      code: 'LOC_TIMEOUT',
      title: 'Location Connection Timeout',
      description: 'The location receiver took too long to fetch a coordinate lock.',
      techLog: 'GeolocationPositionError: TIMEOUT - Coordinate lookup exceeded allotted time window (10000ms).',
      severity: 'warning',
      recoveryAction: 'Ensure you have a steady mobile data signal, or use local Wi-Fi geolocation.',
      retryActionLabel: 'Request Fresh GPS Lock',
      onRetry: retry
    }),
    unableToDetermine: (retry?: () => void): AppError => ({
      code: 'LOC_COORDS_UNDETERMINED',
      title: 'Coordinates Diluted/Undetermined',
      description: 'The returned GPS coordinate accuracy is too low to pin-point a city hazard.',
      techLog: 'Position acquired, but accuracy reading exceeds maximum acceptable limit (> 100 meters).',
      severity: 'warning',
      recoveryAction: 'Wait 5 seconds for GPS warm-up, or drag-and-drop the pinpoint manually on our map tab.',
      retryActionLabel: 'Refresh Coordinates',
      onRetry: retry
    }),
    unsupported: (): AppError => ({
      code: 'LOC_BROWSER_UNSUPPORTED',
      title: 'Geolocation APIs Unsupported',
      description: 'This browser does not support HTML5 Geolocation services.',
      techLog: 'navigator.geolocation object is completely undefined.',
      severity: 'error',
      recoveryAction: 'Please upgrade to standard modern browsers like Google Chrome, Firefox, or Safari.'
    })
  },

  // 10. INTERNET
  internet: {
    offline: (retry?: () => void): AppError => ({
      code: 'NET_OFFLINE',
      title: 'You Are Currently Offline',
      description: 'Internet connection is unavailable. Civora will queue your complaint locally on this device.',
      techLog: 'navigator.onLine evaluated to false. Request caught by service sync worker.',
      severity: 'warning',
      recoveryAction: 'Your reports are saved safely. We will automatically submit them once connection is restored.',
      retryActionLabel: 'Retry Connection Now',
      onRetry: retry
    }),
    slow: (retry?: () => void): AppError => ({
      code: 'NET_SLOW_CONNECTION',
      title: 'Very Slow Network Speed',
      description: 'Network speeds are degraded, causing severe latency in server interactions.',
      techLog: 'NetworkInformation.downlink < 0.1 Mbps or round-trip-time > 2000ms detected.',
      severity: 'warning',
      recoveryAction: 'Please move to a location with stable LTE/5G coverage or connect to high-speed Wi-Fi.',
      retryActionLabel: 'Re-test Latency',
      onRetry: retry
    }),
    timeout: (retry?: () => void): AppError => ({
      code: 'NET_TIMEOUT',
      title: 'Connection Timed Out',
      description: 'The server did not respond to your transmission request in time.',
      techLog: 'HTTP Fetch operation exceeded maximum connection threshold (15000ms).',
      severity: 'warning',
      recoveryAction: 'Check your network and trigger manual retry once signal bars stabilize.',
      retryActionLabel: 'Retry Transmission',
      onRetry: retry
    }),
    unreachable: (retry?: () => void): AppError => ({
      code: 'NET_SERVER_UNREACHABLE',
      title: 'Civora Core Servers Unreachable',
      description: 'Municipal core cloud servers are currently down for scheduled backup or maintenance.',
      techLog: 'Fetch API returned TypeError: Failed to fetch. CORS block or DNS resolution failure.',
      severity: 'error',
      recoveryAction: 'Please wait a few minutes and click submit again. No local data will be lost.',
      retryActionLabel: 'Retry Connection',
      onRetry: retry
    }),
    uploadInterruption: (retry?: () => void): AppError => ({
      code: 'NET_UPLOAD_INTERRUPTED',
      title: 'Network Upload Interrupted',
      description: 'Your internet connection dropped while uploading complaint attachments.',
      techLog: 'TCP connection reset mid-stream or multipart content-length mismatch.',
      severity: 'warning',
      recoveryAction: 'Verify your signal stability. Uploads will resume from the last saved chunk.',
      retryActionLabel: 'Resume Upload',
      onRetry: retry
    })
  },

  // 11. FIREBASE
  firebase: {
    authFailure: (): AppError => ({
      code: 'FB_AUTH_FAILURE',
      title: 'Authentication Infrastructure Down',
      description: 'Firebase Authentication service is temporarily unavailable.',
      techLog: 'auth/internal-error: The authentication server encountered an internal error.',
      severity: 'error',
      recoveryAction: 'Please sign in using Demo Pre-Verified Citizen mode to bypass external authentication.'
    }),
    firestoreUnavailable: (): AppError => ({
      code: 'FB_FIRESTORE_UNAVAILABLE',
      title: 'Database Cloud Down',
      description: 'The primary Cloud Firestore database server is offline.',
      techLog: 'firestore/unavailable: The service is currently unavailable. Retry later.',
      severity: 'error',
      recoveryAction: 'We have enabled local SQLite/IndexedDB caching. You can safely continue using the system.'
    }),
    permissionDenied: (): AppError => ({
      code: 'FB_PERMISSION_DENIED',
      title: 'Durable Write Access Denied',
      description: 'Security parameters blocked this write command from completing.',
      techLog: 'firestore/permission-denied: Missing or insufficient security rules permissions.',
      severity: 'critical',
      recoveryAction: 'Ensure you are signed in. Sandbox systems do not allow anonymous database modifications.'
    }),
    rateLimiting: (): AppError => ({
      code: 'FB_RATE_LIMITING',
      title: 'Database Rate Limit Exceeded',
      description: 'You have triggered too many read/write commands in a short period.',
      techLog: 'firestore/resource-exhausted: Quota exceeded for firestore requests.',
      severity: 'warning',
      recoveryAction: 'Please wait 60 seconds before submitting further data updates.'
    }),
    missingConfig: (): AppError => ({
      code: 'FB_MISSING_CONFIG',
      title: 'Firebase Blueprint Missing',
      description: 'The applet has not been connected to a production Firebase instance yet.',
      techLog: 'firebase/app-not-initialized: Firebase keys not found in firebase-applet-config.json.',
      severity: 'critical',
      recoveryAction: 'Please configure Firebase with AI Studio settings to unlock cloud backups.'
    }),
    expiredSession: (): AppError => ({
      code: 'FB_SESSION_EXPIRED',
      title: 'Auth Token Expired',
      description: 'Your secure authority credentials session has expired.',
      techLog: 'auth/user-token-expired: The user token has expired. Re-authenticate.',
      severity: 'warning',
      recoveryAction: 'Please re-enter your PIN or tap Log In to refresh credentials safely.'
    }),
    invalidToken: (): AppError => ({
      code: 'FB_INVALID_TOKEN',
      title: 'Secure Signature Compromised',
      description: 'The authority security signature contains an invalid token mismatch.',
      techLog: 'auth/invalid-user-token: The credential token is no longer valid.',
      severity: 'critical',
      recoveryAction: 'Log out and perform a fresh login authentication sequence.'
    }),
    storageUnavailable: (): AppError => ({
      code: 'FB_STORAGE_UNAVAILABLE',
      title: 'Cloud Media Storage Down',
      description: 'The Firebase Storage bucket is unreachable.',
      techLog: 'storage/retry-limit-exceeded: Max retry limit exceeded on object storage.',
      severity: 'error',
      recoveryAction: 'Your uploaded media will remain locally cached on this device.'
    })
  },

  // 12. GEMINI AI
  gemini: {
    apiUnavailable: (retry?: () => void): AppError => ({
      code: 'AI_GEMINI_UNAVAILABLE',
      title: 'Gemini Cognitive Server Offline',
      description: 'The Gemini Artificial Intelligence server is unreachable.',
      techLog: 'GoogleGenAI SDK returned connection refused / service unavailable (503).',
      severity: 'error',
      recoveryAction: 'You can bypass AI auto-generation and fill out details manually.',
      retryActionLabel: 'Retry AI Analysis',
      onRetry: retry
    }),
    timeout: (retry?: () => void): AppError => ({
      code: 'AI_TIMEOUT',
      title: 'Cognitive Engine Response Timeout',
      description: 'The Gemini cognitive engine timed out during analysis.',
      techLog: 'Gemini API call timed out (> 12000ms) without returning response stream.',
      severity: 'warning',
      recoveryAction: 'Simplify your description text or retry the generation trigger.',
      retryActionLabel: 'Re-trigger Gemini',
      onRetry: retry
    }),
    rateLimit: (retry?: () => void): AppError => ({
      code: 'AI_RATE_LIMIT',
      title: 'AI Cognitive Limits Exceeded',
      description: 'Gemini cognitive query threshold limit exceeded (Quota exhaustion).',
      techLog: 'GoogleGenAI API response code 429: Resource Exhausted (RPM limit).',
      severity: 'warning',
      recoveryAction: 'Please wait 10 seconds before generating analysis.',
      retryActionLabel: 'Retry AI Query',
      onRetry: retry
    }),
    invalidResponse: (retry?: () => void): AppError => ({
      code: 'AI_INVALID_RESPONSE',
      title: 'Malformed AI Analysis Received',
      description: 'The AI model completed, but returned an invalid schema output.',
      techLog: 'JSON.parse failed on Gemini response payload string.',
      severity: 'warning',
      recoveryAction: 'Try tweaking your input words or click retry to trigger another generation pass.',
      retryActionLabel: 'Retry Parsing',
      onRetry: retry
    }),
    emptyResponse: (retry?: () => void): AppError => ({
      code: 'AI_EMPTY_RESPONSE',
      title: 'AI Generated Empty Content',
      description: 'The cognitive service returned an empty diagnosis output.',
      techLog: 'GoogleGenAI content generation completed, but candidate text array is null or empty.',
      severity: 'warning',
      recoveryAction: 'Please expand your text description with more specific landmark cues.',
      retryActionLabel: 'Re-generate Details',
      onRetry: retry
    }),
    lowConfidence: (): AppError => ({
      code: 'AI_LOW_CONFIDENCE',
      title: 'Unreliable Categorization Confidence',
      description: 'AI model categorization confidence falls below acceptable municipal standards (60%).',
      techLog: 'predictedConfidence score returned < 0.60. Categorization safety threshold triggered.',
      severity: 'warning',
      recoveryAction: 'Please manually audit and correct the assigned category dropdown.'
    }),
    malformedResponse: (retry?: () => void): AppError => ({
      code: 'AI_MALFORMED_RESPONSE',
      title: 'AI Structural Mismatch',
      description: 'The AI cognitive analysis structure is missing mandatory geohash elements.',
      techLog: 'Gemini response JSON schema missing "predictedCategory" or "severityScore" fields.',
      severity: 'warning',
      recoveryAction: 'Input the category manually to bypass AI structured categorization limits.',
      retryActionLabel: 'Retry Structuring',
      onRetry: retry
    })
  },

  // 13. MAPS
  maps: {
    providerUnavailable: (): AppError => ({
      code: 'MAP_PROVIDER_DOWN',
      title: 'Maps Vector Provider Down',
      description: 'The maps tile server is currently unreachable.',
      techLog: 'Leaflet/Google Maps API loaded, but vector grid server returned 502/504 gateway error.',
      severity: 'error',
      recoveryAction: 'Civora will fallback to standard coordinate inputs and geohash grid code feeds.'
    }),
    loadingFailure: (): AppError => ({
      code: 'MAP_LOADING_FAILURE',
      title: 'Maps SDK Loading Error',
      description: 'The Google Maps platform JavaScript SDK failed to compile.',
      techLog: 'script src="maps.googleapis.com" timed out or returned cross-origin block.',
      severity: 'error',
      recoveryAction: 'Ensure you have a reliable network connection and verify browser plugins are not blocking scripts.'
    }),
    invalidCoordinates: (): AppError => ({
      code: 'MAP_INVALID_COORDS',
      title: 'Invalid Map Coordinates',
      description: 'The coordinate set is mathematically invalid (outside latitude/longitude bounds).',
      techLog: 'Map latitude must be between -90 and 90, longitude between -180 and 180.',
      severity: 'warning',
      recoveryAction: 'Please enter valid numbers or center your GPS device on active city bounds.'
    }),
    missingApiKey: (): AppError => ({
      code: 'MAP_MISSING_API_KEY',
      title: 'Maps API Integration Blocked',
      description: 'The Google Maps platform API key has not been configured in Civora project settings.',
      techLog: 'Google Maps script loaded without valid client API Key credential parameter.',
      severity: 'warning',
      recoveryAction: 'Civora will display an interactive, ultra-precise topological vector layout as a fully functional replacement.'
    }),
    gpsMismatch: (): AppError => ({
      code: 'MAP_GPS_MISMATCH',
      title: 'High Discrepancy GPS Geohash',
      description: 'Your selected map pinpoint differs substantially from active device GPS coordinates.',
      techLog: 'Calculated spatial distance between GPS state and manually selected coordinate exceeds 1.5km.',
      severity: 'warning',
      recoveryAction: 'Verify that you are reporting an issue at the physical location, or override the coordinate match.'
    }),
    noInternet: (): AppError => ({
      code: 'MAP_NO_INTERNET',
      title: 'Offline Map Tracking Locked',
      description: 'Map visualization requires active internet bandwidth to download layout vectors.',
      techLog: 'navigator.onLine is false. Tile pipeline shut-down safely.',
      severity: 'warning',
      recoveryAction: 'We will keep track of your typed coordinates. Maps will refresh as soon as you are back online.'
    }),
    unsupportedBrowser: (): AppError => ({
      code: 'MAP_BROWSER_UNSUPPORTED',
      title: 'Web Graphics Unsupported',
      description: 'This browser does not support WebGL standard graphics acceleration required for Map rendering.',
      techLog: 'HTML5 Canvas WebGLContext is null or uninstantiated.',
      severity: 'error',
      recoveryAction: 'Enable "Hardware Acceleration" in your browser settings or switch to standard mobile Safari/Chrome.'
    })
  },

  // 14. AUTHENTICATION
  auth: {
    wrongPassword: (): AppError => ({
      code: 'AUTH_WRONG_PASSWORD',
      title: 'Invalid Credentials PIN',
      description: 'The entered Security PIN or password does not match municipal citizen records.',
      techLog: 'auth/wrong-password: The password is invalid or the user does not have a password.',
      severity: 'warning',
      recoveryAction: 'Please double check your PIN numbers, or select Demo pre-verified citizen mode.'
    }),
    invalidEmail: (): AppError => ({
      code: 'AUTH_INVALID_EMAIL',
      title: 'Malformed Email Account ID',
      description: 'The provided email string format is invalid.',
      techLog: 'auth/invalid-email: The email address is badly formatted.',
      severity: 'warning',
      recoveryAction: 'Enter a valid, structured email address (e.g. name@domain.com).'
    }),
    userNotFound: (): AppError => ({
      code: 'AUTH_USER_NOT_FOUND',
      title: 'Citizen Account Not Found',
      description: 'No registered citizen file exists under this Email / ID.',
      techLog: 'auth/user-not-found: There is no user record corresponding to this identifier.',
      severity: 'warning',
      recoveryAction: 'Tap Quick Access pre-verified citizen login, or sign up for a new account.'
    }),
    emailExists: (): AppError => ({
      code: 'AUTH_EMAIL_ALREADY_EXISTS',
      title: 'Citizen ID Already Registered',
      description: 'An active account is already registered using this email address.',
      techLog: 'auth/email-already-in-use: The email address is already in use by another account.',
      severity: 'warning',
      recoveryAction: 'Please log in with your existing PIN, or recover your access password.'
    }),
    weakPassword: (): AppError => ({
      code: 'AUTH_WEAK_PASSWORD',
      title: 'Weak PIN Protection Blocked',
      description: 'The PIN code is too weak (minimum 6 digits or complex letters).',
      techLog: 'auth/weak-password: The password must be 6 characters long or more.',
      severity: 'warning',
      recoveryAction: 'Provide a strong PIN featuring varied, non-sequential numbers.'
    }),
    cancelled: (): AppError => ({
      code: 'AUTH_GOOGLE_CANCELLED',
      title: 'OAuth SSO Cancelled',
      description: 'The single sign-on authentication sequence was terminated by the user.',
      techLog: 'Google authPopup closed by client before resolution token payload arrival.',
      severity: 'info',
      recoveryAction: 'Click the Single Sign-On button again when you wish to link your credentials.'
    }),
    failure: (): AppError => ({
      code: 'AUTH_GOOGLE_FAILURE',
      title: 'SSO Portal Handshake Failed',
      description: 'Civora failed to establish a secure handshake with the OAuth SSO provider.',
      techLog: 'auth/popup-blocked or credentials signature handshake failed.',
      severity: 'error',
      recoveryAction: 'Ensure your browser does not block popups, or sign in using your PIN directly.'
    }),
    sessionExpired: (): AppError => ({
      code: 'AUTH_SESSION_EXPIRED',
      title: 'Session Token Invalid',
      description: 'Your authentication session expired due to standard security protocols.',
      techLog: 'Secure Token Verification Engine parsed timestamp and triggered automatic session lock.',
      severity: 'warning',
      recoveryAction: 'Please re-sign in using quick access to restore your secure terminal feed.'
    }),
    unauthorizedRole: (): AppError => ({
      code: 'AUTH_UNAUTHORIZED_ROLE',
      title: 'Unauthorized Authority Level',
      description: 'Your logged credential file lacks access privileges for this departmental dashboard.',
      techLog: 'ACL validation failed: requested resource action requires administrative role credentials.',
      severity: 'critical',
      recoveryAction: 'Access restricted. Please sign in with active field engineer or municipal administrator credentials.'
    })
  },

  // 15. COMPLAINT SUBMISSION
  submission: {
    missingMedia: (): AppError => ({
      code: 'SUB_MISSING_MEDIA',
      title: 'No Visual Evidence Attached',
      description: 'A photo or voice memo of the hazard is highly recommended to improve response priority.',
      techLog: 'Client validation warning: Media array size is 0.',
      severity: 'warning',
      recoveryAction: 'Tap the camera icon or voice recorder to capture immediate proof.'
    }),
    missingCategory: (): AppError => ({
      code: 'SUB_MISSING_CATEGORY',
      title: 'Issue Category Required',
      description: 'Please select a valid municipal department category to route your ticket.',
      techLog: 'Validation failed: category field is empty.',
      severity: 'warning',
      recoveryAction: 'Please select a category from the dropdown menu (e.g. Roads, Water, Sanitation).'
    }),
    missingTitle: (): AppError => ({
      code: 'SUB_MISSING_TITLE',
      title: 'Complaint Title Is Missing',
      description: 'A brief, clear title is required to submit your municipal hazard complaint.',
      techLog: 'Validation failed: title field is empty.',
      severity: 'warning',
      recoveryAction: 'Type a descriptive title (e.g. "Overflowing Sewerage Pipe next to Block C").'
    }),
    missingAiResponse: (retry?: () => void): AppError => ({
      code: 'SUB_MISSING_AI_RESPONSE',
      title: 'AI Diagnostic Check Pending',
      description: 'Civora AI classification is pending. We strongly suggest awaiting the AI diagnostic check for faster resolution routing.',
      techLog: 'Validation failed: submission requested while AI diagnosis promise is unresolved.',
      severity: 'warning',
      recoveryAction: 'Wait 3 seconds for the AI engine to finish, or manually select your category and override.',
      retryActionLabel: 'Force Process AI',
      onRetry: retry
    }),
    missingLocation: (): AppError => ({
      code: 'SUB_MISSING_LOCATION',
      title: 'GPS Coordinates Mandatory',
      description: 'We cannot log your complaint without precise GPS latitude and longitude coordinates.',
      techLog: 'Validation failed: location payload coordinates are null or 0,0.',
      severity: 'error',
      recoveryAction: 'Please activate your mobile GPS or pinpoint the issue location manually on the AI Map tab.'
    }),
    uploadFailure: (retry?: () => void): AppError => ({
      code: 'SUB_UPLOAD_FAILURE',
      title: 'Media Transmission Failure',
      description: 'Failed to upload attachments. Your ticket could not be registered on cloud databases.',
      techLog: 'Multi-part file streams failed to complete. Server closed socket before transaction commit.',
      severity: 'error',
      recoveryAction: 'Ensure your internet connection is active, or switch off attachments to submit plain text.',
      retryActionLabel: 'Retry Attachment Upload',
      onRetry: retry
    }),
    databaseFailure: (retry?: () => void): AppError => ({
      code: 'SUB_DATABASE_FAILURE',
      title: 'Municipal Ticket Generation Failed',
      description: 'Civora failed to write your complaint into the primary municipal database.',
      techLog: 'Firestore batch transaction committed and returned TransactionCrashedException.',
      severity: 'critical',
      recoveryAction: 'We have registered this ticket in your local offline queue. It will backup automatically once connections stabilize.',
      retryActionLabel: 'Retry Database Save',
      onRetry: retry
    }),
    duplicateComplaint: (): AppError => ({
      code: 'SUB_DUPLICATE_COMPLAINT',
      title: 'Duplicate Neighborhood Ticket Detected',
      description: 'Civora AI detected a highly similar complaint already logged at these coordinates.',
      techLog: 'Spatial proximity check matched geohash sector with similar category block.',
      severity: 'info',
      recoveryAction: 'Upvote the existing ticket on the map to double its municipal priority instead of double-booking!'
    }),
    cancelled: (): AppError => ({
      code: 'SUB_CANCELLED',
      title: 'Complaint Drafting Discarded',
      description: 'You aborted the complaint drafting form. All temporary input data has been cleared.',
      techLog: 'User action clearForm completed gracefully.',
      severity: 'info',
      recoveryAction: 'Draft a new ticket when you locate a physical infrastructure hazard.'
    }),
    partialFailure: (retry?: () => void): AppError => ({
      code: 'SUB_PARTIAL_FAILURE',
      title: 'Civora Ticket Logged with Warnings',
      description: 'Your complaint was successfully saved, but your high-res media files failed to upload.',
      techLog: 'Database record generated, but attachment upload processes failed after 3 retries.',
      severity: 'warning',
      recoveryAction: 'Your complaint is live! Departmental engineers can resolve it, but uploading photos later will improve response speed.',
      retryActionLabel: 'Upload Attachments Now',
      onRetry: retry
    })
  }
};

// Unified Centralized Hook to handle errors, permissions, and workflow states globally
export function useCivoraReliability() {
  const [activeError, setActiveError] = useState<AppError | null>(null);
  const [permissions, setPermissions] = useState<PermissionsRegistry>({
    camera: {
      status: 'prompt',
      purpose: 'Capture instant high-resolution photographs of potholes, structural damage, water-clogging, or general municipal hazards.',
      consequences: 'Without camera access, you must select mock neighborhood evidence files rather than your own live photos.',
      resolutionSteps: 'Go to Settings > Site Permissions > Camera > Civora > Toggle to "Allow".'
    },
    microphone: {
      status: 'prompt',
      purpose: 'Record audio descriptions or environmental acoustics surrounding structural or industrial pipeline leaks.',
      consequences: 'Disabling microphone prevent citizens from adding detailed voice memo records to their tickets.',
      resolutionSteps: 'Go to Settings > Site Permissions > Microphone > Civora > Select "Allow".'
    },
    location: {
      status: 'prompt',
      purpose: 'Embed precise GPS coordinates and geohash sectoral codes to ensure automated routing and active duplicate ticket detection.',
      consequences: 'Civora requires GPS data. Without it, you cannot submit complaints, as department engineers would not know where to go.',
      resolutionSteps: 'Go to Settings > Site Permissions > Location > Civora > Allow location tracking.'
    },
    notifications: {
      status: 'prompt',
      purpose: 'Send live notifications for engineer dispatch updates, real-time ticket escalations, and resolution audits.',
      consequences: 'You will not receive real-time push alerts and must check the ledger panel manually for ticket status updates.',
      resolutionSteps: 'Go to Settings > Site Permissions > Notifications > Civora > Allow.'
    },
    storage: {
      status: 'prompt',
      purpose: 'Cache complaint drafts, offline databases, and media attachment buffers to prevent data loss in zero-connectivity areas.',
      consequences: 'Offline queueing is disabled. If you lose network coverage, your complaint drafts might be lost.',
      resolutionSteps: 'Go to Settings > Cookies and Site Storage > Civora > Enable offline cache storage.'
    }
  });

  // Raise an error and log it
  const raiseError = (error: AppError) => {
    setActiveError(error);
    logTechnicalError(error);
  };

  const clearActiveError = () => {
    setActiveError(null);
  };

  // Query initial browser permissions where supported on mount
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.permissions) return;

    const queryPermission = async (type: keyof PermissionsRegistry, apiName: PermissionName) => {
      try {
        const result = await navigator.permissions.query({ name: apiName });
        const updateStatus = (state: PermissionState['status']) => {
          setPermissions(prev => ({
            ...prev,
            [type]: { ...prev[type], status: state }
          }));
        };

        updateStatus(result.state as PermissionState['status']);
        result.onchange = () => {
          updateStatus(result.state as PermissionState['status']);
        };
      } catch (e) {
        // Fallback or ignore unsupported permission queries
      }
    };

    queryPermission('location', 'geolocation');
    queryPermission('camera', 'camera' as PermissionName);
    queryPermission('microphone', 'microphone' as PermissionName);
    queryPermission('notifications', 'notifications');
  }, []);

  // Request actual browser-native permission
  const requestPermission = async (type: keyof PermissionsRegistry): Promise<'granted' | 'denied' | 'permanently_denied'> => {
    let outcome: 'granted' | 'denied' | 'permanently_denied' = 'denied';

    try {
      if (type === 'location') {
        outcome = await new Promise<'granted' | 'denied' | 'permanently_denied'>((resolve) => {
          if (typeof navigator === 'undefined' || !navigator.geolocation) {
            raiseError(ErrorCatalog.location.unsupported());
            resolve('denied');
            return;
          }
          navigator.geolocation.getCurrentPosition(
            () => {
              resolve('granted');
            },
            (error) => {
              if (error.code === error.PERMISSION_DENIED) {
                resolve('denied');
              } else {
                resolve('denied');
              }
            },
            { enableHighAccuracy: true, timeout: 8000 }
          );
        });
      } else if (type === 'camera') {
        if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          raiseError(ErrorCatalog.camera.unsupported());
          return 'denied';
        }
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(track => track.stop());
          outcome = 'granted';
        } catch (err: any) {
          console.warn('Camera permission request error:', err);
          outcome = 'denied';
        }
      } else if (type === 'microphone') {
        if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          raiseError(ErrorCatalog.audio.unsupported());
          return 'denied';
        }
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop());
          outcome = 'granted';
        } catch (err: any) {
          console.warn('Microphone permission request error:', err);
          outcome = 'denied';
        }
      } else if (type === 'notifications') {
        if (typeof window !== 'undefined' && 'Notification' in window) {
          const res = await Notification.requestPermission();
          outcome = res === 'granted' ? 'granted' : 'denied';
        } else {
          outcome = 'denied';
        }
      } else if (type === 'storage') {
        outcome = 'granted';
      }

      // Check for persistent browser setting denial
      if (outcome === 'denied' && typeof navigator !== 'undefined' && navigator.permissions) {
        try {
          let name: PermissionName | undefined;
          if (type === 'location') name = 'geolocation';
          else if (type === 'camera') name = 'camera' as PermissionName;
          else if (type === 'microphone') name = 'microphone' as PermissionName;
          else if (type === 'notifications') name = 'notifications';

          if (name) {
            const status = await navigator.permissions.query({ name });
            if (status.state === 'denied') {
              outcome = 'permanently_denied';
            }
          }
        } catch (e) {
          // Ignore exceptions from query in certain iframe sandbox configurations
        }
      }
    } catch (e) {
      console.error('Error requesting permission:', e);
      outcome = 'denied';
    }

    setPermissions(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        status: outcome
      }
    }));

    if (outcome === 'denied') {
      if (type === 'camera') raiseError(ErrorCatalog.camera.denied());
      if (type === 'microphone') raiseError(ErrorCatalog.audio.micDenied());
      if (type === 'location') raiseError(ErrorCatalog.location.denied());
    } else if (outcome === 'permanently_denied') {
      if (type === 'camera') raiseError(ErrorCatalog.camera.permanentlyDenied());
      if (type === 'microphone') raiseError(ErrorCatalog.audio.micDenied());
      if (type === 'location') raiseError(ErrorCatalog.location.permanentlyDenied());
    }

    return outcome;
  };

  return {
    activeError,
    permissions,
    raiseError,
    clearActiveError,
    requestPermission,
    setPermissions
  };
}
