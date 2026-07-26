// Routes a notification tap to the tab that shows the notified content.
//
// Two entry points have to be covered:
//   - warm  : the app is already running, `addNotificationResponseReceivedListener` fires.
//   - cold  : the tap launched the app, so the response is only available from
//             `getLastNotificationResponseAsync()`.
//
// Navigation cannot run until the root navigator has mounted — expo-router
// throws ("Attempted to navigate before mounting the Root Layout component")
// otherwise. OnboardingWrapper and OfflineGuard both withhold the <Slot> while
// they load, so on a cold start the navigator can still be missing by the time
// the notification response resolves. The target is therefore held in state and
// flushed once the navigation container reports ready.
//
// The URL itself travels through WebViewNavigationContext rather than as a route
// param: the tab screens own their WebView URL state, and a pending navigation
// parked in the context is still there when the target screen mounts.
//
// Must be called inside WebViewNavigationProvider (see app/_layout.tsx).
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { useNavigationContainerRef, useRouter } from "expo-router";
import { useWebViewNavigation } from "@/contexts/WebViewNavigationContext";
import {
  NotificationTarget,
  resolveNotificationTarget,
} from "@/utils/notificationLink";

// Readiness is polled rather than taken from the container's "state" event:
// that event can fire before a listener added during this render attaches, and
// a missed edge would strand the deep link. Polling only runs while a tap is
// pending, so the idle cost is nothing.
const NAV_READY_POLL_MS = 150;

// `getLastNotificationResponseAsync()` keeps returning the last tapped
// notification on later launches, which would drag the user back to old content
// every time they open the app. Remembering the last handled id keeps the cold
// start path to a single navigation per notification.
const HANDLED_ID_KEY = "lastHandledNotificationId";

async function markHandled(id: string): Promise<void> {
  try {
    await AsyncStorage.setItem(HANDLED_ID_KEY, id);
  } catch {
    // Best-effort: a failed write only risks one redundant navigation.
  }
}

async function wasAlreadyHandled(id: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(HANDLED_ID_KEY)) === id;
  } catch {
    return false;
  }
}

export function useNotificationDeepLink(): void {
  const router = useRouter();
  const navigationRef = useNavigationContainerRef();
  const { navigateToUrl } = useWebViewNavigation();
  const [target, setTarget] = useState<NotificationTarget | null>(null);

  // Cold start: the tap that launched the app.
  useEffect(() => {
    let cancelled = false;

    Notifications.getLastNotificationResponseAsync()
      .then(async (response) => {
        if (cancelled || !response) {
          return;
        }
        const { identifier, content } = response.notification.request;
        if (await wasAlreadyHandled(identifier)) {
          return;
        }
        const resolved = resolveNotificationTarget(content.data);
        if (!resolved || cancelled) {
          return;
        }
        await markHandled(identifier);
        setTarget(resolved);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  // Warm: a tap while the app is running is unambiguous, so it always navigates.
  // The id is still recorded so the cold start path does not replay it later.
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const { identifier, content } = response.notification.request;
        const resolved = resolveNotificationTarget(content.data);
        void markHandled(identifier);
        if (resolved) {
          setTarget(resolved);
        }
      }
    );
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!target) {
      return;
    }
    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;

    const flushWhenReady = () => {
      if (cancelled) {
        return;
      }
      if (!navigationRef.isReady()) {
        pollTimer = setTimeout(flushWhenReady, NAV_READY_POLL_MS);
        return;
      }
      // Park the URL before switching tabs so the target screen sees it whether
      // it is mounting for the first time or is already on screen.
      navigateToUrl(target.url, target.targetTab);
      router.navigate(target.pathname);
      setTarget(null);
    };

    flushWhenReady();

    return () => {
      cancelled = true;
      if (pollTimer) {
        clearTimeout(pollTimer);
      }
    };
  }, [target, navigationRef, navigateToUrl, router]);
}
