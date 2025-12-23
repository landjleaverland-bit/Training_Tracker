# Training Tracker

A Svelte-based training tracker application, powered by [`sv`](https://github.com/sveltejs/cli).

## Quick Setup

For first-time setup, use the automated setup script:

```sh
./setup.sh
```

This script will:
- ✅ Check your operating system compatibility
- ✅ Install Node.js v22 (if not already installed)
- ✅ Install all project dependencies
- ✅ Install functions dependencies
- ✅ Run a security audit
- ✅ Display next steps

### Manual Setup

If you prefer to set up manually or the script doesn't work for your system:

```sh
# Install Node.js v22 (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install nodejs -y

# Install project dependencies
npm install

# Install functions dependencies
cd functions && npm install && cd ..
```

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
