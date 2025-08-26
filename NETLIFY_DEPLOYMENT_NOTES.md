# Netlify Deployment: Environment Variables Setup

For the MarkSheet Digitizer app to function correctly when deployed on Netlify, you need to configure the necessary environment variables in your Netlify site settings.

## 1. Required Environment Variables

You will need to configure keys for both Google AI (for Genkit) and Supabase (for authentication).

*   **`GOOGLE_API_KEY`**: Your API key for Google AI (e.g., Gemini). The Genkit Google AI plugin will look for this environment variable.
*   **`NEXT_PUBLIC_SUPABASE_URL`**: The project URL for your Supabase instance.
*   **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**: The `anon` (anonymous) public key for your Supabase instance.

**Important:** Do NOT commit your actual API keys or secrets to your GitHub repository.

## 2. Add Environment Variables to Netlify

1.  Go to your site dashboard on [Netlify](https://app.netlify.com/).
2.  Navigate to **Site configuration** (or **Site settings**).
3.  Go to **Build & deploy** -> **Environment variables**.
4.  Click **Edit variables**.
5.  Add the following three variables, replacing the placeholder values with your actual credentials from your Supabase project dashboard and Google Cloud Console.

    *   **Key**: `GOOGLE_API_KEY`
    *   **Value**: `your-actual-google-ai-api-key-here`

    *   **Key**: `NEXT_PUBLIC_SUPABASE_URL`
    *   **Value**: `https://oqdklnurxnugottyezxt.supabase.co`

    *   **Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    *   **Value**: `your-supabase-anon-key-here`

6.  Click **Save**.

## 3. Redeploy

After adding/updating the environment variables, you **must** trigger a new deploy for your site on Netlify. It's highly recommended to use the "Clear cache and deploy site" option if available. This ensures that the new build uses the environment variables you've just configured across all functions.

This setup will resolve server-side errors related to missing API keys when Genkit flows are executed and will allow the app to connect to Supabase for authentication.
