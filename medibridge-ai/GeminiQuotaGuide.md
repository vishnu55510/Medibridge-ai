# Gemini API Quota Management Guide

If you are seeing "AI rate limit exceeded" or "429 Too Many Requests" errors, your Gemini API key has hit its usage limits.

## Common Free Tier Limits (as of March 2026)
- **Model**: `gemini-1.5-flash`
    - **RPM** (Requests Per Minute): 15
    - **RPD** (Requests Per Day): 1,500
    - **TPM** (Tokens Per Minute): 1,000,000
- **Model**: `gemini-1.5-pro`
    - **RPM**: 2
    - **RPD**: 50
    - **TPM**: 32,000

## How to Overcome Limits

### 1. Check Your Quota
1.  Go to the [Google AI Studio](https://aistudio.google.com/).
2.  Click on the **Settings** (gear icon) or check the **Plan** section.
3.  You can see your current usage and limits there.

### 2. Enable Billing (Pay-as-you-go)
The easiest way to get much higher limits is to enable billing in Google Cloud or AI Studio.
- **Pay-as-you-go** tier has significantly higher RPM and TPM limits.
- You only pay for what you use beyond the free tier.

### 3. Use gemini-1.5-flash
We have updated the app's code to use `gemini-1.5-flash`. This model is:
- **Faster**: Ideal for quick data extraction.
- **Higher Limits**: 15 RPM vs 2 RPM for the Pro model.

### 4. Optimize Requests
- **Wait**: If you hit a limit, wait 60 seconds before trying again.
- **Batching**: Only click "Generate Insights" once you have uploaded all your records.

### 5. Multi-Key Rotation (Not Recommended)
While you *could* technically create multiple API keys under different projects, Google may detect this as circumvention of free tier limits. It is better to use the Paid tier for production usage.
