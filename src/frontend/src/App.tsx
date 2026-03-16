import { Toaster } from "@/components/ui/sonner";
import ProfileSetupModal from "./components/ProfileSetupModal";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "./hooks/useQueries";
import GalleryPage from "./pages/GalleryPage";
import LoginPage from "./pages/LoginPage";

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched,
  } = useGetCallerUserProfile();
  const showProfileSetup =
    isAuthenticated && !profileLoading && isFetched && userProfile === null;

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <>
      {isAuthenticated ? <GalleryPage /> : <LoginPage />}
      {showProfileSetup && <ProfileSetupModal />}
      <Toaster theme="dark" richColors position="bottom-right" />
    </>
  );
}
