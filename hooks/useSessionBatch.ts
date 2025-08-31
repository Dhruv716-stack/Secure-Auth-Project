import { useEffect, useRef, useState } from "react";

// Helper to get device info
function getDeviceInfo() {
  // Language mapping (very basic, can be expanded)
  const langMap: Record<string, string> = {
    'en': 'English',
    'hi': 'Hindi',
    'fr': 'French',
    'es': 'Spanish',
    'de': 'German',
    'zh': 'Chinese',
    'ja': 'Japanese',
    'ru': 'Russian',
    'ar': 'Arabic',
    'pt': 'Portuguese',
    'bn': 'Bengali',
    'pa': 'Punjabi',
    'mr': 'Marathi',
    'te': 'Telugu',
    'ta': 'Tamil',
    'ur': 'Urdu',
    'gu': 'Gujarati',
    'kn': 'Kannada',
    'ml': 'Malayalam',
    'or': 'Odia',
    'fa': 'Persian',
    'tr': 'Turkish',
    'it': 'Italian',
    'ko': 'Korean',
    'vi': 'Vietnamese',
    'th': 'Thai',
    'pl': 'Polish',
    'uk': 'Ukrainian',
    'ro': 'Romanian',
    'nl': 'Dutch',
    'sv': 'Swedish',
    'fi': 'Finnish',
    'no': 'Norwegian',
    'da': 'Danish',
    'cs': 'Czech',
    'el': 'Greek',
    'hu': 'Hungarian',
    'he': 'Hebrew',
    'id': 'Indonesian',
    'ms': 'Malay',
    'fil': 'Filipino',
    'sr': 'Serbian',
    'sk': 'Slovak',
    'hr': 'Croatian',
    'bg': 'Bulgarian',
    'sl': 'Slovenian',
    'lt': 'Lithuanian',
    'lv': 'Latvian',
    'et': 'Estonian',
    'is': 'Icelandic',
    'ga': 'Irish',
    'mt': 'Maltese',
    'sq': 'Albanian',
    'mk': 'Macedonian',
    'sw': 'Swahili',
    'zu': 'Zulu',
    'xh': 'Xhosa',
    'af': 'Afrikaans',
    'am': 'Amharic',
    'yo': 'Yoruba',
    'ig': 'Igbo',
    'ha': 'Hausa',
    'so': 'Somali',
    'ne': 'Nepali',
    'si': 'Sinhala',
    'my': 'Burmese',
    'km': 'Khmer',
    'lo': 'Lao',
    'mn': 'Mongolian',
    'ka': 'Georgian',
    'hy': 'Armenian',
    'az': 'Azerbaijani',
    'kk': 'Kazakh',
    'uz': 'Uzbek',
    'tk': 'Turkmen',
    'ky': 'Kyrgyz',
    'tg': 'Tajik',
    'ps': 'Pashto',
    'ku': 'Kurdish',
    'ckb': 'Kurdish (Sorani)',
    'ug': 'Uyghur',
    'tt': 'Tatar',
    'ba': 'Bashkir',
    'cv': 'Chuvash',
    'ce': 'Chechen',
    'os': 'Ossetian',
    'sah': 'Sakha',
    'kv': 'Komi',
    'av': 'Avar',
    'lbe': 'Lak',
    'lez': 'Lezgian',
    'tab': 'Tabasaran',
    'kum': 'Kumyk',
    'dar': 'Dargwa',
    'inh': 'Ingush',
    'kbd': 'Kabardian',
    'ady': 'Adyghe',
    'udm': 'Udmurt',
    'mhr': 'Meadow Mari',
    'chm': 'Mari',
    'myv': 'Erzya',
    'mdf': 'Moksha',
    'sme': 'Northern Sami',
    'smj': 'Lule Sami',
    'sma': 'Southern Sami',
    'sms': 'Skolt Sami',
    'smn': 'Inari Sami',
    'nb': 'Norwegian Bokmål',
    'nn': 'Norwegian Nynorsk',
    'fo': 'Faroese',
    'kl': 'Greenlandic',
    'en-US': 'English',
    'en-GB': 'English',
  };

  // Get language code (e.g., 'en' from 'en-US')
  const langCode = navigator.language.split('-')[0];
  const language = langMap[langCode] || navigator.language;

  // Browser detection
  function getBrowserName() {
    const ua = navigator.userAgent;
    if (/chrome|crios|crmo/i.test(ua) && !/edge|edg|opr|opera/i.test(ua)) return 'Chrome';
    if (/firefox|fxios/i.test(ua)) return 'Firefox';
    if (/safari/i.test(ua) && !/chrome|crios|crmo/i.test(ua)) return 'Safari';
    if (/edg/i.test(ua)) return 'Edge';
    if (/opr|opera/i.test(ua)) return 'Opera';
    if (/msie|trident/i.test(ua)) return 'Internet Explorer';
    return 'Other';
  }

  // Device type detection (Mobile, Tablet, Desktop)
  function getDeviceType() {
    const ua = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(ua)) return 'Tablet';
    if (/mobi|android|touch|mini/i.test(ua)) return 'Mobile';
    return 'PC';
  }

  // Device orientation (Portrait/Landscape)
  function getOrientation() {
    const orientation = window.screen.orientation?.type || '';
    if (orientation.includes('portrait')) return 'Portrait';
    if (orientation.includes('landscape')) return 'Landscape';
    // fallback
    return window.innerHeight > window.innerWidth ? 'Portrait' : 'Landscape';
  }

  return {
    device_type: getDeviceType(),
    screen_size: `${window.screen.width}x${window.screen.height}`,
    browser_info: getBrowserName(),
    language,
    timezone_offset: new Date().getTimezoneOffset(),
    device_orientation: getOrientation(),
  };
}

// Helper to get city from lat/lng
async function getCityFromLatLng(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );
    const data = await res.json();
    return (
      data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      data.address?.state ||
      ""
    );
  } catch {
    return "";
  }
}

type PendingTransaction = { amount: number; date: string } | null;

export function useSessionBatch(customerId: string, sessionId: string, pendingTransaction: PendingTransaction = null) {
  // Always call all hooks
  const eventCounts = useRef({
    click: 0,
    scroll: 0,
    touch: 0,
    keyboard: 0,
    mouse: 0,
  });
  const startTime = useRef(Date.now());
  const buffer = useRef<any[]>([]);
  const cityRef = useRef("");
  const cityFetched = useRef(false);

  const [avgAmount, setAvgAmount] = useState(0);
  const [recentDate, setRecentDate] = useState("");
  const usedPending = useRef(false);

  useEffect(() => {
    usedPending.current = false;
  }, [pendingTransaction]);

  useEffect(() => {
    // Only do work if ready, but always call the effect
    if (!customerId || !sessionId) return;

    // Fetch transaction history on mount
    fetch("/api/transactions")
      .then(res => res.json())
      .then(data => {
        const txs = data.transactions || [];
        if (txs.length > 0) {
          setAvgAmount(
            txs.reduce((sum: number, tx: any) => sum + Number(tx.amount), 0) / txs.length
          );
          setRecentDate(txs[0].createdAt); // assuming sorted by date desc
        } else {
          setAvgAmount(0);
          setRecentDate("");
        }
      });

    // Get geolocation once
    if (!cityFetched.current && typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        cityRef.current = await getCityFromLatLng(latitude, longitude);
        cityFetched.current = true;
      });
    }

    // Event listeners
    const increment = (type: keyof typeof eventCounts.current) => () => eventCounts.current[type]++;
    window.addEventListener("click", increment("click"));
    window.addEventListener("scroll", increment("scroll"));
    window.addEventListener("touchstart", increment("touch"));
    window.addEventListener("keydown", increment("keyboard"));
    window.addEventListener("mousemove", increment("mouse"));

    // Device info (static)
    const deviceInfo = getDeviceInfo();

    // Collect data every second
    const collectInterval = setInterval(() => {
      const timeOnPage = Math.floor((Date.now() - startTime.current) / 1000);
      let transaction_amount = 0;
      let transaction_date = recentDate;
      // If no transaction history, use current date and 0
      if (!recentDate) {
        transaction_date = new Date().toISOString();
      }
      // If a real transaction just occurred, use its values
      if (pendingTransaction && !usedPending.current) {
        transaction_amount = pendingTransaction.amount;
        transaction_date = pendingTransaction.date;
        usedPending.current = true;
        console.log('[SessionBatch] Using REAL transaction:', pendingTransaction);
      } else {
        console.log('[SessionBatch] Using ZERO transaction:', { transaction_amount, transaction_date });
      }
      buffer.current.push({
        customer_id: customerId,
        session_id: sessionId,
        ...deviceInfo,
        click_events: eventCounts.current.click,
        scroll_events: eventCounts.current.scroll,
        touch_events: eventCounts.current.touch,
        keyboard_events: eventCounts.current.keyboard,
        device_motion: 0, // TODO: add device motion logic if needed
        time_on_page: timeOnPage,
        geolocation_city: cityRef.current,
        transaction_amount,
        transaction_date,
        mouse_movement: eventCounts.current.mouse,
      });
      // Optionally reset counts for per-second deltas
      // eventCounts.current = { click: 0, scroll: 0, touch: 0, keyboard: 0, mouse: 0 };
    }, 1000);

    // Send batch every 10 seconds
    const sendInterval = setInterval(() => {
      if (buffer.current.length > 0) {
        console.log("Sending batch to /api/model-input", buffer.current);
        fetch("/api/model-input", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buffer.current),
        })
          .then(res => res.json())
          .then(data => {
            console.log("Batch response:", data);
          })
          .catch(err => {
            console.error("Batch error:", err);
          });
        buffer.current = [];
      }
    }, 10000);

    // Send remaining data on unload
    const handleUnload = () => {
      if (buffer.current.length > 0) {
        navigator.sendBeacon(
          "/api/model-input",
          JSON.stringify(buffer.current)
        );
        buffer.current = [];
      }
    };
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      clearInterval(collectInterval);
      clearInterval(sendInterval);
      window.removeEventListener("click", increment("click"));
      window.removeEventListener("scroll", increment("scroll"));
      window.removeEventListener("touchstart", increment("touch"));
      window.removeEventListener("keydown", increment("keyboard"));
      window.removeEventListener("mousemove", increment("mouse"));
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [customerId, sessionId, pendingTransaction]);
} 