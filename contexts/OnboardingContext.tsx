import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
}

interface OnboardingContextType {
  isOnboardingActive: boolean;
  currentStep: number;
  totalSteps: number;
  startOnboarding: () => void;
  nextStep: () => void;
  previousStep: () => void;
  completeOnboarding: () => void;
  skipOnboarding: () => void;
  getCurrentStepData: () => OnboardingStep | null;
  isFirstTime: boolean;
  isLoading: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined
);

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to The TheCrypto.Wiki !",
    description:
      "Master the crypto universe with your all-in-one hub for learning, investing, and connecting with the visionaries reshaping finance.",
  },
  {
    id: "posts",
    title: "Learn Like a Pro",
    description:
      "Dive into expertly crafted guides, tutorials and articles for beginners and advanced users. Stay ahead with up-to-date strategies, market trends and blockchain innovations.",
  },
  {
    id: "exchanges",
    title: "Exchange Reviews",
    description:
      "Explore detailed, unbiased reviews of top crypto exchanges. Compare security features and user experiences to make informed trading decisions.",
  },
  {
    id: "ogs",
    title: "Crypto Innovators & Legends",
    description:
      "Get inspired by the stories of crypto's OG pioneers and visionaries. Access their public profiles, social links and explore their wallet addresses to learn from their moves.",
  },
  {
    id: "tools",
    title: "Smarter Tools",
    description:
      "Access powerful tools including Fear & Greed Index, Bitcoin Rainbow Chart, Market Heatmap, Staking Calculator, and Random Coin Generator for smarter investment decisions.",
  },
  {
    id: "portfolio",
    title: "Track Your Crypto Portfolio",
    description:
      "Seamlessly manage and monitor your investments in one place. Add from over 500+ cryptocurrencies and track real-time value and performance of your entire portfolio.",
  },
  {
    id: "save-content",
    title: "Read Offline, Learn Anywhere",
    description:
      "Download content to your phone and access it later without needing an internet connection. Perfect for your commute or travel.",
  },
];

const ONBOARDING_KEY = "onboarding_completed";

interface OnboardingProviderProps {
  children: React.ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const totalSteps = ONBOARDING_STEPS.length;

  useEffect(() => {
    checkFirstTime();
  }, []);

  const checkFirstTime = async () => {
    try {
      const completed = await AsyncStorage.getItem(ONBOARDING_KEY);
      if (!completed) {
        setIsFirstTime(true);
        setIsOnboardingActive(true);
      }
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
    }
  };

  const startOnboarding = useCallback(() => {
    setIsOnboardingActive(true);
    setCurrentStep(0);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  }, [currentStep, totalSteps]);

  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const completeOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
      setIsOnboardingActive(false);
      setCurrentStep(0);
      setIsFirstTime(false);
    } catch (error) {
      // Silent error handling
    }
  }, []);

  const skipOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
      setIsOnboardingActive(false);
      setCurrentStep(0);
      setIsFirstTime(false);
    } catch (error) {
      // Silent error handling
    }
  }, []);

  const getCurrentStepData = useCallback(() => {
    return ONBOARDING_STEPS[currentStep] || null;
  }, [currentStep]);

  const contextValue: OnboardingContextType = {
    isOnboardingActive,
    currentStep,
    totalSteps,
    startOnboarding,
    nextStep,
    previousStep,
    completeOnboarding,
    skipOnboarding,
    getCurrentStepData,
    isFirstTime,
    isLoading,
  };

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}
