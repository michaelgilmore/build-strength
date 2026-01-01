import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendTempPasswordRequest {
  username: string;
}

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-temp-password function invoked");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username }: SendTempPasswordRequest = await req.json();
    console.log("Looking up username:", username);

    if (!username || username.trim() === "") {
      return new Response(
        JSON.stringify({ error: "Username is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Look up the user's profile by username
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, email, display_name")
      .eq("username", username)
      .maybeSingle();

    if (profileError) {
      console.error("Profile lookup error:", profileError);
      return new Response(
        JSON.stringify({ error: "Failed to look up user" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!profile) {
      console.log("No profile found for username:", username);
      return new Response(
        JSON.stringify({ error: "Username not found", noEmail: false }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user has an email that's not the generated local one
    const hasRealEmail = profile.email && !profile.email.endsWith("@muscleforge.local");

    if (!hasRealEmail) {
      console.log("No email associated with username:", username);
      return new Response(
        JSON.stringify({ error: "No email associated with this account", noEmail: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate a temporary password
    const tempPassword = generateTempPassword();
    console.log("Generated temp password for user:", profile.user_id);

    // Update the user's password using admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      profile.user_id,
      { password: tempPassword }
    );

    if (updateError) {
      console.error("Password update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to reset password" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send the email with temp password
    const displayName = profile.display_name || username;
    const emailResponse = await resend.emails.send({
      from: "Muscle Forge <onboarding@resend.dev>",
      to: [profile.email],
      subject: "Your Temporary Password - Muscle Forge",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #f97316; margin-bottom: 20px;">Password Reset</h1>
          <p style="margin-bottom: 15px;">Hi ${displayName},</p>
          <p style="margin-bottom: 15px;">You requested a password reset for your Muscle Forge account.</p>
          <p style="margin-bottom: 15px;">Your temporary password is:</p>
          <div style="background-color: #1a1a1a; color: #ffffff; padding: 15px 20px; border-radius: 8px; font-family: monospace; font-size: 18px; letter-spacing: 2px; text-align: center; margin: 20px 0;">
            ${tempPassword}
          </div>
          <p style="margin-bottom: 15px;">Please log in with this password and change it immediately in your Settings.</p>
          <p style="color: #888; font-size: 14px; margin-top: 30px;">If you didn't request this, please ignore this email or contact support.</p>
          <p style="margin-top: 20px;">Keep crushing it! 💪</p>
          <p style="color: #f97316; font-weight: bold;">The Muscle Forge Team</p>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Temporary password sent to your email" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-temp-password function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
