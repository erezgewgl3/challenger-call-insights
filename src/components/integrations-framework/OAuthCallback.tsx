import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { OAuthLoading } from "./OAuthLoading";
import { OAuthSuccess } from "./OAuthSuccess";
import { OAuthError } from "./OAuthError";

type CallbackState = "loading" | "success" | "error";

interface CallbackData {
  integrationName?: string;
  connectionName?: string;
  error?: string;
}

export function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [state, setState] = useState<CallbackState>("loading");
  const [data, setData] = useState<CallbackData>({});

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Extract URL parameters
        const code = searchParams.get("code");
        const oauthState = searchParams.get("state");
        const error = searchParams.get("error");
        const integrationId = searchParams.get("integration_id");

        // Handle OAuth error (user cancelled, permission denied, etc.)
        if (error) {
          setState("error");
          setData({ error: `OAuth error: ${error}` });
          return;
        }

        // Validate required parameters
        if (!code || !oauthState || !integrationId) {
          setState("error");
          setData({ error: "Missing required OAuth parameters" });
          return;
        }

        console.log("Processing OAuth callback:", { code: code.substring(0, 10) + "...", integrationId, state: oauthState });

        // Call the existing integration-callback Edge Function
        const { data: result, error: callbackError } = await supabase.functions.invoke(
          "integration-callback",
          {
            body: {
              code,
              state: oauthState,
              integration_id: integrationId,
            },
          }
        );

        if (callbackError) {
          console.error("Callback error:", callbackError);
          setState("error");
          setData({ error: callbackError.message || "Failed to process OAuth callback" });
          return;
        }

        console.log("OAuth callback successful:", result);
        setState("success");
        setData({
          integrationName: result?.integration_name || integrationId,
          connectionName: result?.connection_name || "Integration",
        });

        // Auto-redirect based on user role after 3 seconds
        const redirectPath = user?.role === 'admin' ? '/admin' : '/integrations?refresh=true';
        setTimeout(() => {
          navigate(redirectPath);
        }, 3000);

      } catch (err) {
        console.error("OAuth callback processing error:", err);
        setState("error");
        setData({ error: "An unexpected error occurred during OAuth processing" });
      }
    };

    processCallback();
  }, [searchParams, navigate]);

  if (state === "loading") {
    return <OAuthLoading />;
  }

  if (state === "error") {
    return <OAuthError error={data.error} onRetry={() => navigate("/admin")} />;
  }

  return (
    <OAuthSuccess
      integrationName={data.integrationName}
      connectionName={data.connectionName}
      onContinue={() => navigate("/admin")}
    />
  );
}