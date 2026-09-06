import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CreditReminderModal } from '@/components/credits/CreditReminderModal';
import { toast } from '@/hooks/use-toast';
import {
  CREDIT_REMINDER_DEV_CHECK_EVENT,
  CREDIT_REMINDER_DEV_LOCAL_EVENT,
  OverdueCredit,
  clearCreditReminderShown,
  fetchOverdueCredits,
  hasCreditReminderBeenShown,
  markCreditReminderShown,
} from '@/lib/creditReminders';

/**
 * App-wide gate that checks for 7-day-overdue credit invoices once per login
 * session and presents the reminder popup.
 *
 * Behaviour:
 *  - Fires on the unauthenticated -> authenticated transition (fresh login or
 *    an initial session restore).
 *  - A sessionStorage flag prevents repeated evaluation until the flag is
 *    cleared (i.e. the user logs out, or the browser tab/session ends).
 *  - Failures to fetch never block the app — the user simply gets no popup.
 *  - Dev-only events (see @/lib/creditReminders) let an already logged-in
 *    developer re-run the check or inject local credits for testing.
 */
const CreditReminderGate = () => {
  const { user } = useAuth();
  const wasAuthenticated = useRef(Boolean(user));
  const [overdueCredits, setOverdueCredits] = useState<OverdueCredit[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  // Developer triggers (Settings -> Database & Infrastructure, dev builds):
  // re-check the database right away, bypassing the once-per-session flag.
  useEffect(() => {
    if (!user) return;

    const handleDevCheck = () => {
      clearCreditReminderShown();
      void (async () => {
        try {
          const overdue = await fetchOverdueCredits();
          markCreditReminderShown();
          if (overdue.length === 0) {
            toast({
              title: 'No overdue credits found',
              description: 'The overdue query returned no rows. Make sure the seed migration is applied.',
              variant: 'destructive',
            });
            return;
          }
          setOverdueCredits(overdue);
          setIsVisible(true);
        } catch (error) {
          console.error('[CreditReminder] Dev re-check failed:', error);
          toast({
            title: 'Unable to check overdue credits',
            description: error instanceof Error ? error.message : 'Unknown error',
            variant: 'destructive',
          });
        }
      })();
    };

    const handleDevLocal = (event: Event) => {
      const credits = (event as CustomEvent<OverdueCredit[]>).detail;
      if (!Array.isArray(credits) || credits.length === 0) return;
      setOverdueCredits(credits);
      setIsVisible(true);
    };

    window.addEventListener(CREDIT_REMINDER_DEV_CHECK_EVENT, handleDevCheck);
    window.addEventListener(CREDIT_REMINDER_DEV_LOCAL_EVENT, handleDevLocal);
    return () => {
      window.removeEventListener(CREDIT_REMINDER_DEV_CHECK_EVENT, handleDevCheck);
      window.removeEventListener(CREDIT_REMINDER_DEV_LOCAL_EVENT, handleDevLocal);
    };
  }, [user]);

  useEffect(() => {
    const isAuthenticated = Boolean(user);

    if (isAuthenticated && !wasAuthenticated.current) {
      wasAuthenticated.current = true;

      if (hasCreditReminderBeenShown()) return;

      void (async () => {
        try {
          const overdue = await fetchOverdueCredits();
          // Marked as evaluated even when empty so a page refresh in the same
          // session does not re-run the check or re-open the popup.
          markCreditReminderShown();
          if (overdue.length > 0) {
            setOverdueCredits(overdue);
            setIsVisible(true);
          }
        } catch (error) {
          console.error('[CreditReminder] Unable to check overdue credits:', error);
        }
      })();
      return;
    }

    if (!isAuthenticated && wasAuthenticated.current) {
      // Session ended — allow the next login to re-evaluate.
      wasAuthenticated.current = false;
      setIsVisible(false);
      setOverdueCredits([]);
      clearCreditReminderShown();
    }
  }, [user]);

  if (!isVisible) return null;

  return (
    <CreditReminderModal
      overdueCredits={overdueCredits}
      onDismiss={() => {
        setIsVisible(false);
        setOverdueCredits([]);
      }}
    />
  );
};

export { CreditReminderGate };