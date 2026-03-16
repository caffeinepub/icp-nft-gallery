import { Button } from "@/components/ui/button";
import { Hexagon, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginPage() {
  const { login, loginStatus } = useInternetIdentity();
  const isLoggingIn = loginStatus === "logging-in";

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error("Login error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background texture */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "url('/assets/generated/nft-hero-bg.dim_1920x400.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center top",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/80 to-background" />

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-md w-full text-center"
        >
          {/* Logo mark */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex justify-center mb-8"
          >
            <div className="relative">
              <Hexagon
                className="text-primary w-16 h-16"
                strokeWidth={1}
                fill="oklch(0.78 0.14 75 / 0.1)"
              />
              <span className="absolute inset-0 flex items-center justify-center font-display font-bold text-primary text-lg">
                N
              </span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="font-display text-4xl font-bold text-foreground tracking-tight mb-3"
          >
            ICP NFT Gallery
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="text-muted-foreground text-base leading-relaxed mb-10"
          >
            Mint your images as on-chain NFTs on the Internet Computer. Store
            them in your personal gallery and transfer to any wallet.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <Button
              size="lg"
              onClick={handleLogin}
              disabled={isLoggingIn}
              data-ocid="auth.login_button"
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-10 py-6 text-base h-auto rounded-sm transition-all duration-200 hover:shadow-gold"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Login with Internet Identity"
              )}
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="mt-6 text-xs text-muted-foreground/60"
          >
            Secured by Internet Identity — no passwords, no data leaks
          </motion.p>
        </motion.div>
      </main>

      <footer className="relative z-10 py-6 text-center">
        <p className="text-xs text-muted-foreground/40">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-muted-foreground transition-colors"
          >
            Built with ♥ using caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
