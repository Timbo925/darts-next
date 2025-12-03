# Deploying Darts App to Vercel

This guide will walk you through deploying your Next.js Darts Scorer app to Vercel.

## Prerequisites

1. A [Vercel account](https://vercel.com/signup) (free tier is sufficient)
2. Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
3. Node.js 18+ installed locally (for testing)

## Step 1: Prepare Your Repository

Ensure your code is committed and pushed to your Git repository:

```bash
git add .
git commit -m "Convert to Next.js"
git push origin main
```

## Step 2: Install Dependencies Locally (Optional but Recommended)

Before deploying, test the build locally:

```bash
npm install
npm run build
```

If the build succeeds, you're ready to deploy!

## Step 3: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended for First Time)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..."** → **"Project"**
3. Import your Git repository:
   - If this is your first time, connect your Git provider (GitHub/GitLab/Bitbucket)
   - Select the repository containing your darts app
4. Vercel will auto-detect Next.js and configure the project:
   - **Framework Preset**: Next.js (should be auto-detected)
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `next build` (should be auto-filled)
   - **Output Directory**: `.next` (should be auto-filled)
   - **Install Command**: `npm install` (should be auto-filled)
5. Click **"Deploy"**
6. Wait for the build to complete (usually 1-2 minutes)

### Option B: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Set up and deploy? **Yes**
   - Which scope? (Select your account)
   - Link to existing project? **No** (for first deployment)
   - Project name? (Press Enter for default or enter a custom name)
   - Directory? `./` (Press Enter)
   - Override settings? **No**

4. For production deployment:
   ```bash
   vercel --prod
   ```

## Step 4: Verify Deployment

After deployment completes:

1. Vercel will provide you with a deployment URL (e.g., `https://dartsapp.vercel.app`)
2. Click the URL to open your app
3. Test the app functionality:
   - Create a new game
   - Play a game
   - Check history
   - Verify all features work

## Step 5: Configure Custom Domain (Optional)

1. In your Vercel project dashboard, go to **Settings** → **Domains**
2. Enter your domain name
3. Follow Vercel's instructions to configure DNS records
4. Wait for DNS propagation (can take up to 48 hours, usually much faster)

## Environment Variables

This app doesn't require any environment variables as it's fully client-side with localStorage for data persistence.

## Build Settings

Vercel should auto-detect these settings, but if you need to configure manually:

- **Framework**: Next.js
- **Build Command**: `next build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Node Version**: 18.x or higher

## Troubleshooting

### Build Fails

1. **Check build logs** in Vercel dashboard for specific errors
2. **Common issues**:
   - Missing dependencies: Ensure all packages are in `package.json`
   - TypeScript errors: Fix any type errors locally first
   - Import path errors: Ensure all imports use correct relative paths

### App Doesn't Work After Deployment

1. **Check browser console** for errors
2. **Verify localStorage** is working (some browsers block it in certain contexts)
3. **Check network tab** for failed requests
4. **Review Vercel function logs** if using API routes (this app doesn't use them)

### Performance Issues

1. **Enable Vercel Analytics** in project settings
2. **Check bundle size** - Next.js automatically optimizes, but large dependencies can slow things down
3. **Use Vercel's Edge Network** - automatically enabled for static assets

## Continuous Deployment

Vercel automatically deploys on every push to your main branch:

1. Push changes to your repository
2. Vercel detects the push
3. Builds and deploys automatically
4. Creates a preview deployment for pull requests

## Rollback

If something goes wrong:

1. Go to your project dashboard on Vercel
2. Click **"Deployments"** tab
3. Find the previous working deployment
4. Click the **"..."** menu → **"Promote to Production"**

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Vercel Support](https://vercel.com/support)

## Notes

- This app uses **localStorage** for data persistence, so data is stored in the user's browser
- No backend/server required - fully static deployment
- All game data is client-side only
- The app works offline after initial load (PWA capabilities can be added later)

